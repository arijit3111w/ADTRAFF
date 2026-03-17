"""
FlowCast Backend — Traffic Prediction API
==========================================
Self-contained Flask server that provides traffic predictions
based on coordinates, time window, and travel date.

Uses a deterministic heuristic model that simulates realistic
Nigerian traffic patterns (rush hours, distance-based ETA, etc.)
until the full ADTRAFF XGBoost models are trained and available.
"""

import os
import math
import random
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import date

app = Flask(__name__)
CORS(app)

EARTH_RADIUS = 6371  # km


# ─── Geometry ───────────────────────────────────────────────────
def haversine_km(lat1, lon1, lat2, lon2):
    """Straight-line distance between two lat/lon points in km."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return EARTH_RADIUS * 2 * math.asin(math.sqrt(a))


# ─── Traffic Pattern Engine ─────────────────────────────────────
def _congestion_label(index):
    if index < 25:  return "Free Flow"
    if index < 45:  return "Light"
    if index < 65:  return "Moderate"
    if index < 80:  return "Heavy"
    return "Severe"


def _base_congestion(hour, day_of_week):
    """
    Generate a realistic congestion index (0-100) based on
    Nigerian urban traffic patterns.
    """
    is_weekend = day_of_week >= 5

    # Base congestion curve by hour (Nigerian city pattern)
    if is_weekend:
        # Weekend: lighter overall, small midday bump
        pattern = {
            0: 8, 1: 5, 2: 4, 3: 4, 4: 5, 5: 8,
            6: 15, 7: 22, 8: 30, 9: 38, 10: 42, 11: 45,
            12: 48, 13: 45, 14: 42, 15: 40, 16: 38, 17: 35,
            18: 30, 19: 25, 20: 20, 21: 15, 22: 12, 23: 10,
        }
    else:
        # Weekday: strong morning + evening rush
        pattern = {
            0: 10, 1: 8, 2: 6, 3: 5, 4: 8, 5: 15,
            6: 35, 7: 62, 8: 78, 9: 72, 10: 55, 11: 48,
            12: 50, 13: 48, 14: 45, 15: 50, 16: 60, 17: 75,
            18: 80, 19: 68, 20: 50, 21: 35, 22: 22, 23: 15,
        }
    return pattern.get(hour, 30)


def _predict_hour(distance_km, n_segments, hour, travel_date):
    """Predict congestion and ETA for a specific hour."""
    dow = travel_date.weekday()
    base_cong = _base_congestion(hour, dow)

    # Add some deterministic variation based on the coordinates hash
    seed = hash((hour, travel_date.toordinal())) % 1000
    rng = random.Random(seed)
    variation = rng.uniform(-8, 8)
    congestion = max(5, min(95, base_cong + variation))

    # ETA depends on distance and congestion
    # Base speed: 40-80 km/h depending on congestion
    effective_speed = 80 - (congestion / 100) * 55  # 25-80 km/h range
    eta_minutes = (distance_km / effective_speed) * 60

    # Add per-segment overhead (stops, intersections)
    eta_minutes += n_segments * rng.uniform(0.5, 2.0)

    return round(congestion, 2), round(eta_minutes, 2)


def find_best_time(start_lat, start_lon, end_lat, end_lon,
                   start_hour=6, end_hour=21, travel_date=None):
    """
    Find the best hour to travel between two coordinate pairs.
    Returns a result dict matching the ADTRAFF API format exactly.
    """
    if travel_date is None:
        travel_date = date.today()

    distance_km = round(haversine_km(start_lat, start_lon, end_lat, end_lon), 2)

    # Generate route segments (interpolated waypoints)
    n_waypoints = 6
    lats = np.linspace(start_lat, end_lat, n_waypoints)
    lons = np.linspace(start_lon, end_lon, n_waypoints)

    route_segments = []
    for i, (lat, lon) in enumerate(zip(lats, lons)):
        route_segments.append({
            "segment_id": f"SEG_{i+1:04d}",
            "lat": round(float(lat), 6),
            "lon": round(float(lon), 6),
            "avg_speed_kmh": round(40 + random.Random(i).uniform(0, 40), 2),
            "density_veh_per_km": round(10 + random.Random(i+100).uniform(0, 50), 2),
            "incidents": random.Random(i+200).randint(0, 1),
        })

    n_segments = len(route_segments)

    # Sweep every hour in the window
    hourly_breakdown = []
    for hour in range(start_hour, end_hour + 1):
        congestion, eta = _predict_hour(distance_km, n_segments, hour, travel_date)
        composite = 0.6 * eta + 0.4 * (congestion / 100) * eta
        hourly_breakdown.append({
            "hour": hour,
            "total_eta_minutes": eta,
            "avg_congestion_index": congestion,
            "congestion_level": _congestion_label(congestion),
            "composite_score": round(composite, 4),
        })

    # Pick best hour (lowest composite score)
    best = min(hourly_breakdown, key=lambda x: x["composite_score"])
    arrival_hour = int(best["hour"] + best["total_eta_minutes"] / 60) % 24

    # Generate per-segment detail for the best hour
    best_segment_detail = []
    for seg in route_segments:
        seg_cong = best["avg_congestion_index"] + random.Random(hash(seg["segment_id"])).uniform(-10, 10)
        seg_cong = max(5, min(95, seg_cong))
        seg_eta = best["total_eta_minutes"] / n_segments
        best_segment_detail.append({
            "segment_id": seg["segment_id"],
            "lat": seg["lat"],
            "lon": seg["lon"],
            "congestion_index": round(seg_cong, 2),
            "eta_minutes": round(seg_eta, 2),
            "congestion_level": _congestion_label(seg_cong),
        })

    return {
        # Core answer
        "best_departure_hour": best["hour"],
        "best_departure_label": f"{best['hour']:02d}:00",
        "best_arrival_hour": arrival_hour,
        "best_arrival_label": f"{arrival_hour:02d}:00",
        "best_total_eta_minutes": best["total_eta_minutes"],
        "best_avg_congestion": best["avg_congestion_index"],
        "best_congestion_level": best["congestion_level"],
        "best_composite_score": best["composite_score"],

        # Input summary
        "start": {"lat": start_lat, "lon": start_lon},
        "end": {"lat": end_lat, "lon": end_lon},
        "distance_km": distance_km,
        "travel_date": str(travel_date),

        # Route
        "route_segments": route_segments,
        "route_segment_count": n_segments,

        # Hourly breakdown
        "hourly_breakdown": hourly_breakdown,

        # Best hour segment detail
        "best_hour_segment_detail": best_segment_detail,
    }


# ─── API Endpoint ───────────────────────────────────────────────
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        start_lat = float(data.get('start_lat'))
        start_lon = float(data.get('start_lon'))
        end_lat = float(data.get('end_lat'))
        end_lon = float(data.get('end_lon'))

        start_hour = int(data.get('start_hour', 6))
        end_hour = int(data.get('end_hour', 21))

        travel_date_str = data.get('travel_date')
        if travel_date_str:
            year, month, day = map(int, travel_date_str.split('-'))
            travel_date = date(year, month, day)
        else:
            travel_date = date.today()

        result = find_best_time(
            start_lat=start_lat,
            start_lon=start_lon,
            end_lat=end_lat,
            end_lon=end_lon,
            start_hour=start_hour,
            end_hour=end_hour,
            travel_date=travel_date
        )

        return jsonify(result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'online', 'model': 'FlowCast Traffic Predictor'})


if __name__ == '__main__':
    print("=" * 50)
    print("  FlowCast Backend — Traffic Prediction API")
    print("  Running on http://localhost:5000")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=True)
