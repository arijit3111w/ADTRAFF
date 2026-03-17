"""
Best Time to Travel — Lat/Lon Input
=====================================
Input  : start_lat, start_lon, end_lat, end_lon, start_hour, end_hour, travel_date
Process: interpolate waypoints → snap to nearest road segments → sweep each hour
         in the window → score each hour by composite ETA + congestion
Output : best departure hour, total ETA, congestion level, full hourly breakdown,
         per-segment detail, straight-line distance

Dependencies:
    pip install pandas numpy scikit-learn xgboost joblib

Required model artifacts (same folder):
    model_congestion_xgb.pkl
    model_eta_xgb.pkl
    segment_label_encoder.pkl
    feature_scaler.pkl
    raw_traffic.csv   (segment coordinate database)

Usage (standalone):
    python best_time_latlng.py

Usage (as Flask module):
    from best_time_latlng import find_best_time
    result = find_best_time(
        start_lat=6.5, start_lon=13.0,
        end_lat=8.5,   end_lon=14.5,
        start_hour=6,  end_hour=21,
    )
"""

import warnings
import numpy as np
import pandas as pd
import joblib
from datetime import date
from sklearn.neighbors import BallTree

warnings.filterwarnings("ignore")


# ─────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────

import os
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(PROJECT_ROOT, "models")
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

MODEL_CONGESTION_PATH = os.path.join(MODELS_DIR, "model_congestion_xgb.pkl")
MODEL_ETA_PATH        = os.path.join(MODELS_DIR, "model_eta_xgb.pkl")
LABEL_ENCODER_PATH    = os.path.join(MODELS_DIR, "segment_label_encoder.pkl")
FEATURE_SCALER_PATH   = os.path.join(MODELS_DIR, "feature_scaler.pkl")
SEGMENT_DB_PATH       = os.path.join(DATA_DIR, "nigerian_transport_and_logistics_traffic_flow.parquet")

N_WAYPOINTS   = 6     # number of interpolation points between start and end
EARTH_RADIUS  = 6371  # km

FEATURE_COLS = [
    "sin_hour", "cos_hour",
    "sin_dow",  "cos_dow",
    "day_of_month", "month",
    "is_weekend", "time_bucket",
    "lat", "lon",
    "segment_encoded",
    "density_veh_per_km",
    "avg_speed_kmh",
    "incidents",
    "speed_density",
    "speed_efficiency",
]
ETA_FEATURES = FEATURE_COLS + ["pred_congestion"]
SCALE_COLS   = [
    "lat", "lon",
    "density_veh_per_km",
    "avg_speed_kmh",
    "speed_density",
    "speed_efficiency",
]


# ─────────────────────────────────────────
# LOAD ALL ARTIFACTS AT STARTUP
# ─────────────────────────────────────────

print("Loading model artifacts...")

model_congestion = joblib.load(MODEL_CONGESTION_PATH)
model_eta        = joblib.load(MODEL_ETA_PATH)
label_encoder    = joblib.load(LABEL_ENCODER_PATH)
scaler           = joblib.load(FEATURE_SCALER_PATH)

# Build segment coordinate database + spatial index
_raw_df = pd.read_parquet(SEGMENT_DB_PATH)
SEGMENT_DB = _raw_df.groupby("segment_id").agg(
    lat=("lat", "mean"),
    lon=("lon", "mean"),
    avg_speed_kmh=("avg_speed_kmh", "median"),
    density_veh_per_km=("density_veh_per_km", "median"),
    incidents=("incidents", "median"),
).reset_index()
SEGMENT_DB["incidents"] = SEGMENT_DB["incidents"].round().astype(int)

# BallTree for O(log n) nearest-segment lookups using Haversine distance
_coords_rad = np.radians(SEGMENT_DB[["lat", "lon"]].values)
SPATIAL_INDEX = BallTree(_coords_rad, metric="haversine")

print(f"Loaded {len(SEGMENT_DB)} road segments into spatial index.")


# ─────────────────────────────────────────
# GEOMETRY HELPERS
# ─────────────────────────────────────────

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Straight-line distance between two lat/lon points in km."""
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlam = np.radians(lon2 - lon1)
    a = np.sin(dphi / 2) ** 2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlam / 2) ** 2
    return EARTH_RADIUS * 2 * np.arcsin(np.sqrt(a))


def nearest_segment(lat: float, lon: float) -> dict:
    """Return the closest road segment to a given lat/lon point."""
    pt = np.radians([[lat, lon]])
    dist_rad, idxs = SPATIAL_INDEX.query(pt, k=1)
    dist_km = float(dist_rad[0][0]) * EARTH_RADIUS
    row = SEGMENT_DB.iloc[idxs[0][0]]
    return {
        "segment_id":         row["segment_id"],
        "lat":                round(float(row["lat"]), 6),
        "lon":                round(float(row["lon"]), 6),
        "avg_speed_kmh":      round(float(row["avg_speed_kmh"]), 2),
        "density_veh_per_km": round(float(row["density_veh_per_km"]), 2),
        "incidents":          int(row["incidents"]),
        "snap_distance_km":   round(dist_km, 3),
    }


def build_route(
    start_lat: float, start_lon: float,
    end_lat:   float, end_lon:   float,
    n_waypoints: int = N_WAYPOINTS,
) -> tuple:
    """
    Interpolate n_waypoints along the straight-line path from start to end,
    then snap each waypoint to its nearest road segment.
    Duplicate segments are skipped so each segment appears at most once.

    Returns:
        route    : list of segment dicts (ordered source → destination)
        dist_km  : straight-line distance between start and end
    """
    lats = np.linspace(start_lat, end_lat, n_waypoints)
    lons = np.linspace(start_lon, end_lon, n_waypoints)

    seen = set()
    route = []

    for lat, lon in zip(lats, lons):
        pt = np.radians([[lat, lon]])
        # Query k=5 candidates and take the first unseen one
        _, idxs = SPATIAL_INDEX.query(pt, k=5)
        for idx in idxs[0]:
            seg_id = SEGMENT_DB.iloc[idx]["segment_id"]
            if seg_id not in seen:
                seen.add(seg_id)
                row = SEGMENT_DB.iloc[idx]
                route.append({
                    "segment_id":         row["segment_id"],
                    "lat":                round(float(row["lat"]), 6),
                    "lon":                round(float(row["lon"]), 6),
                    "avg_speed_kmh":      round(float(row["avg_speed_kmh"]), 2),
                    "density_veh_per_km": round(float(row["density_veh_per_km"]), 2),
                    "incidents":          int(row["incidents"]),
                })
                break

    dist_km = haversine_km(start_lat, start_lon, end_lat, end_lon)
    return route, round(dist_km, 2)


# ─────────────────────────────────────────
# FEATURE ENGINEERING
# ─────────────────────────────────────────

def _time_bucket(hour: int) -> int:
    if 6  <= hour <= 9:  return 0   # morning rush
    if 10 <= hour <= 15: return 1   # midday
    if 16 <= hour <= 19: return 2   # evening rush
    return 3                        # night


def _build_feature_rows(segments: list, hour: int, travel_date: date) -> pd.DataFrame:
    dow        = travel_date.weekday()
    dom        = travel_date.day
    month      = travel_date.month
    is_weekend = int(dow >= 5)

    rows = []
    for seg in segments:
        density = float(seg["density_veh_per_km"])
        speed   = float(seg["avg_speed_kmh"])
        sid     = seg["segment_id"]
        rows.append({
            "sin_hour":           np.sin(2 * np.pi * hour / 24),
            "cos_hour":           np.cos(2 * np.pi * hour / 24),
            "sin_dow":            np.sin(2 * np.pi * dow / 7),
            "cos_dow":            np.cos(2 * np.pi * dow / 7),
            "day_of_month":       dom,
            "month":              month,
            "is_weekend":         is_weekend,
            "time_bucket":        _time_bucket(hour),
            "lat":                float(seg["lat"]),
            "lon":                float(seg["lon"]),
            "segment_encoded":    int(label_encoder.transform([sid])[0])
                                  if sid in label_encoder.classes_ else 0,
            "density_veh_per_km": density,
            "avg_speed_kmh":      speed,
            "incidents":          int(seg.get("incidents", 0)),
            "speed_density":      speed * density,
            "speed_efficiency":   speed / (density + 1),
        })

    df = pd.DataFrame(rows)
    df[SCALE_COLS] = scaler.transform(df[SCALE_COLS])
    return df


# ─────────────────────────────────────────
# PREDICTION
# ─────────────────────────────────────────

def _congestion_label(index: float) -> str:
    if index < 25:  return "free flow"
    if index < 45:  return "light"
    if index < 65:  return "moderate"
    if index < 80:  return "heavy"
    return "severe"


def _predict_route_at_hour(segments: list, hour: int, travel_date: date) -> dict:
    """Run congestion + ETA inference for all segments at a given hour."""
    df = _build_feature_rows(segments, hour, travel_date)

    cong_preds          = model_congestion.predict(df[FEATURE_COLS])
    df["pred_congestion"] = cong_preds
    eta_preds           = model_eta.predict(df[ETA_FEATURES])

    segment_detail = []
    for i, seg in enumerate(segments):
        segment_detail.append({
            "segment_id":       seg["segment_id"],
            "lat":              seg["lat"],
            "lon":              seg["lon"],
            "congestion_index": round(float(cong_preds[i]), 2),
            "eta_minutes":      round(float(eta_preds[i]),  2),
            "congestion_level": _congestion_label(float(cong_preds[i])),
        })

    return {
        "total_eta_minutes":    round(float(eta_preds.sum()), 2),
        "avg_congestion_index": round(float(cong_preds.mean()), 2),
        "segment_detail":       segment_detail,
    }


def _composite_score(total_eta: float, avg_congestion: float,
                     eta_w: float, cong_w: float) -> float:
    """Lower is better. ETA in minutes; congestion normalised to [0,1]."""
    return eta_w * total_eta + cong_w * (avg_congestion / 100) * total_eta


# ─────────────────────────────────────────
# PUBLIC API
# ─────────────────────────────────────────

def find_best_time(
    start_lat:   float,
    start_lon:   float,
    end_lat:     float,
    end_lon:     float,
    start_hour:  int   = 6,
    end_hour:    int   = 21,
    travel_date: date  = None,
    n_waypoints: int   = N_WAYPOINTS,
    eta_weight:  float = 0.6,
    cong_weight: float = 0.4,
) -> dict:
    """
    Find the best hour to travel from start_lat/lon to end_lat/lon.

    Args:
        start_lat, start_lon : source coordinates
        end_lat,   end_lon   : destination coordinates
        start_hour           : earliest departure hour in window (0–23)
        end_hour             : latest  departure hour in window (0–23)
        travel_date          : date of travel; defaults to today
        n_waypoints          : number of intermediate route points (default 6)
        eta_weight           : weight for ETA in composite score (default 0.6)
        cong_weight          : weight for congestion in composite score (default 0.4)

    Returns:
        Full result dict including best_departure_hour, hourly_breakdown,
        route_segments, and per-segment detail for the best hour.
    """
    if travel_date is None:
        travel_date = date.today()

    if start_hour > end_hour:
        raise ValueError("start_hour must be ≤ end_hour")

    # 1. Build route from lat/lon
    route_segments, dist_km = build_route(
        start_lat, start_lon, end_lat, end_lon, n_waypoints
    )

    if not route_segments:
        raise RuntimeError("Could not find any road segments near the given coordinates.")

    # 2. Sweep every hour in the window
    hours = list(range(start_hour, end_hour + 1))
    hourly = []

    for hour in hours:
        pred = _predict_route_at_hour(route_segments, hour, travel_date)
        score = _composite_score(
            pred["total_eta_minutes"],
            pred["avg_congestion_index"],
            eta_weight, cong_weight,
        )
        hourly.append({
            "hour":                 hour,
            "total_eta_minutes":    pred["total_eta_minutes"],
            "avg_congestion_index": pred["avg_congestion_index"],
            "congestion_level":     _congestion_label(pred["avg_congestion_index"]),
            "composite_score":      round(score, 4),
            "_segment_detail":      pred["segment_detail"],
        })

    # 3. Pick best hour
    best = min(hourly, key=lambda x: x["composite_score"])

    # Estimated arrival (minutes converted to hours, wrapped at 24)
    arrival_hour = int(best["hour"] + best["total_eta_minutes"] / 60) % 24

    # Clean breakdown (remove internal key)
    breakdown = [
        {k: v for k, v in h.items() if k != "_segment_detail"}
        for h in hourly
    ]

    return {
        # ── Core answer ──
        "best_departure_hour":      best["hour"],
        "best_departure_label":     f"{best['hour']:02d}:00",
        "best_arrival_hour":        arrival_hour,
        "best_arrival_label":       f"{arrival_hour:02d}:00",
        "best_total_eta_minutes":   best["total_eta_minutes"],
        "best_avg_congestion":      best["avg_congestion_index"],
        "best_congestion_level":    _congestion_label(best["avg_congestion_index"]),
        "best_composite_score":     best["composite_score"],

        # ── Input summary ──
        "start":       {"lat": start_lat, "lon": start_lon},
        "end":         {"lat": end_lat,   "lon": end_lon},
        "distance_km": dist_km,
        "travel_date": str(travel_date),

        # ── Route ──
        "route_segments":           route_segments,
        "route_segment_count":      len(route_segments),

        # ── Hourly breakdown across the window ──
        "hourly_breakdown":         breakdown,

        # ── Segment-level detail at the best hour ──
        "best_hour_segment_detail": best["_segment_detail"],
    }


# ─────────────────────────────────────────
# PRETTY PRINT
# ─────────────────────────────────────────

def print_result(result: dict):
    W = 65
    print("\n" + "=" * W)
    print("  BEST TIME TO TRAVEL")
    print("=" * W)
    print(f"  From          : ({result['start']['lat']}, {result['start']['lon']})")
    print(f"  To            : ({result['end']['lat']},   {result['end']['lon']})")
    print(f"  Distance      : ~{result['distance_km']} km (straight line)")
    print(f"  Date          : {result['travel_date']}")
    print(f"  Route segments: {result['route_segment_count']}")
    print()
    print(f"  ✓ Best departure : {result['best_departure_label']}")
    print(f"  ✓ Est. arrival   : ~{result['best_arrival_label']}")
    print(f"  ✓ Total ETA      : {result['best_total_eta_minutes']:.1f} min")
    print(f"  ✓ Avg congestion : {result['best_avg_congestion']:.1f}  ({result['best_congestion_level']})")

    print(f"\n  {'Hour':<8} {'ETA (min)':>10} {'Congestion':>12} {'Level':<12} {'Score':>8}")
    print("  " + "-" * (W - 2))
    for h in result["hourly_breakdown"]:
        star = "  ◀ best" if h["hour"] == result["best_departure_hour"] else ""
        print(
            f"  {h['hour']:02d}:00  "
            f"{h['total_eta_minutes']:>10.2f}  "
            f"{h['avg_congestion_index']:>11.2f}  "
            f"{h['congestion_level']:<12}"
            f"{h['composite_score']:>8.4f}"
            f"{star}"
        )

    print(f"\n  Per-segment breakdown at {result['best_departure_label']}:")
    print(f"  {'Segment':<16} {'Lat':>8} {'Lon':>9} {'Speed':>8} {'Cong':>7} {'ETA':>8}  Level")
    print("  " + "-" * (W - 2))
    for s in result["best_hour_segment_detail"]:
        seg_src = next((r for r in result["route_segments"] if r["segment_id"] == s["segment_id"]), {})
        speed   = seg_src.get("avg_speed_kmh", "-")
        print(
            f"  {s['segment_id']:<16}"
            f"{s['lat']:>9.4f}"
            f"{s['lon']:>9.4f}"
            f"{speed:>9}"
            f"{s['congestion_index']:>7.1f}"
            f"{s['eta_minutes']:>8.2f} min"
            f"  {s['congestion_level']}"
        )
    print("=" * W)


# ─────────────────────────────────────────
# EXAMPLE — run directly
# ─────────────────────────────────────────

if __name__ == "__main__":

    result = find_best_time(
        start_lat  = 6.5,
        start_lon  = 13.0,
        end_lat    = 8.5,
        end_lon    = 14.5,
        start_hour = 6,
        end_hour   = 21,
        travel_date = date(2025, 3, 17),
        n_waypoints = 6,
        eta_weight  = 0.6,
        cong_weight = 0.4,
    )

    print_result(result)
