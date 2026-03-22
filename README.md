# 🚦 ADTRAFF — Best Time To Travel

> A full-stack machine learning system that predicts the **optimal departure hour** for road journeys in Nigeria based on segment-level traffic data, geographical coordinates, and time-of-day congestion patterns.

![FlowCast Dashboard](https://img.shields.io/badge/Frontend-React_+_Vite-61DAFB?style=flat&logo=react) ![Flask API](https://img.shields.io/badge/Backend-Flask_API-000000?style=flat&logo=flask) ![XGBoost](https://img.shields.io/badge/ML-XGBoost_Cascade-blue?style=flat)

---

## ✨ Features

- **Coordinate-based input** — Enter origin & destination as `longitude, latitude`
- **Preferred time interval** — Set a start and end hour for your departure window
- **Hourly ETA breakdown** — View predicted travel time for every hour in the window
- **Best departure time** — Automatically highlights the optimal hour to leave
- **Distance calculation** — Shows straight-line distance (km) between origin and destination
- **Interactive map** — Mapbox dark-theme map with origin/destination markers and animated route
- **Quick presets** — One-click routes: Lagos→Abuja, Port Harcourt→Enugu, Kano→Kaduna

---

## 📁 Project Structure

```
ADTRAFF/
├── app.py                          ← Flask backend (prediction API)
├── flowcast-frontend/              ← React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                 ← Main application (single-file dashboard)
│   │   ├── index.css               ← Global styles
│   │   └── components/             ← Reusable UI components
│   ├── .env                        ← Mapbox token (gitignored)
│   └── package.json
│
├── ADTRAFF-main/                   ← ML model scripts
│   ├── scripts/
│   │   ├── preprocess.py           ← Data cleaning + feature engineering
│   │   ├── train_model.py          ← XGBoost model training
│   │   └── best_time_latlng.py     ← Inference with lat/lon coordinates
│   └── models/                     ← Trained model artifacts (gitignored)
│
├── data/
│   ├── raw/Traffic.csv
│   └── processed/traffic_processed.csv
│
└── notebooks/                      ← Jupyter notebooks for exploration
    ├── 01_data_preprocessing.ipynb
    ├── 02_model_training.ipynb
    └── 03_model_evaluation.ipynb
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+)
- **Python** (3.9+)
- **pip** packages: `flask flask-cors numpy`

### 1. Install Frontend Dependencies

```bash
cd flowcast-frontend
npm install
```

### 2. Set Up Mapbox Token

Create a `.env` file inside `flowcast-frontend/`:

```
VITE_MAPBOX_TOKEN=your_mapbox_public_token_here
```

### 3. Start the Backend

```bash
# From project root
python app.py
```

The Flask API will start on `http://localhost:5000`.

### 4. Start the Frontend

```bash
# From project root
npm run dev
```

The frontend will start on `http://localhost:5173`.

---

## 🔌 API Reference

### `POST /predict`

Predict the best departure time for a route.

**Request Body:**

```json
{
  "start_lat": 6.5244,
  "start_lon": 3.3792,
  "end_lat": 9.0579,
  "end_lon": 7.4951,
  "start_hour": 6,
  "end_hour": 21,
  "travel_date": "2026-03-17"
}
```

**Response:**

```json
{
  "best_departure_hour": 6,
  "best_departure_label": "06:00",
  "best_total_eta_minutes": 559.0,
  "best_congestion_level": "Free Flow",
  "distance_km": 533.79,
  "hourly_breakdown": [
    { "hour": 6, "total_eta_minutes": 559.0, "avg_congestion_index": 24.5, "congestion_level": "Free Flow" },
    { "hour": 7, "total_eta_minutes": 669.0, "avg_congestion_index": 62.0, "congestion_level": "Moderate" }
  ],
  "route_segment_count": 6
}
```

### `GET /health`

Returns server status.

---

## 🤖 ML Pipeline

The project uses **two cascaded XGBoost Regressors**:

```
16 features → Congestion Model → pred_congestion_index
                   ↓
(16 features + pred_congestion) → ETA Model → eta_minutes
```

### Features Used

| Feature | Description |
|---|---|
| `sin_hour`, `cos_hour` | Cyclical hour encoding |
| `sin_dow`, `cos_dow` | Cyclical day-of-week encoding |
| `day_of_month`, `month` | Calendar features |
| `is_weekend` | Binary weekend flag |
| `time_bucket` | Traffic period (0=morning rush, 1=midday, 2=evening rush, 3=night) |
| `lat`, `lon` | Scaled segment coordinates |
| `segment_encoded` | Integer-encoded segment ID |
| `density_veh_per_km` | Vehicle density |
| `avg_speed_kmh` | Average speed |
| `incidents` | Binary incident flag |
| `speed_density` | Speed × density interaction |
| `speed_efficiency` | Speed ÷ (density + 1) ratio |

### Congestion Levels

| Index Range | Level |
|---|---|
| < 25 | 🟢 Free Flow |
| 25–44 | 🟡 Light |
| 45–64 | 🟠 Moderate |
| 65–79 | 🔴 Heavy |
| ≥ 80 | 🔴 Severe |

### Dataset

**Source**: `electricsheepafrica/nigerian_transport_and_logistics_traffic_flow` (HuggingFace)  
**Scale**: ~180,000 rows | 115,958 unique road segments

### Training the Models

```bash
cd ADTRAFF-main/scripts

# Step 1: Preprocess data
python preprocess.py

# Step 2: Train XGBoost models
python train_model.py
```

This generates four artifacts in `ADTRAFF-main/models/`:
- `model_congestion_xgb.pkl` — Congestion regressor
- `model_eta_xgb.pkl` — ETA regressor
- `segment_label_encoder.pkl` — Label encoder for segment IDs
- `feature_scaler.pkl` — MinMax scaler for numeric features

---

## 🧠 Key Technical Concepts

| Concept | Implementation |
|---|---|
| Cyclical time encoding | Sine/cosine of hour and day-of-week |
| Cascaded models | Congestion prediction fed as feature to ETA model |
| Spatial lookup | BallTree with Haversine metric for nearest road snap |
| Route building | Waypoint interpolation + segment deduplication |
| Hourly sweep | Predict every hour; pick lowest composite score |
| Composite scoring | `0.6 × ETA + 0.4 × (congestion/100) × ETA` |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Framer Motion, Recharts, Mapbox GL JS |
| Backend | Flask, Flask-CORS |
| ML | XGBoost, Scikit-Learn, Pandas, NumPy |
| Map | Mapbox GL JS (dark theme) |

---

*Built with Python, React, and XGBoost.*
