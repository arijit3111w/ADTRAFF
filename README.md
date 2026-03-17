# 🚦 Nigerian Traffic Flow — Best Time To Travel

> A machine learning system that predicts the **optimal departure hour** for a road journey in Nigeria based on real-time segment-level traffic data, geographical coordinates, historical congestion patterns, and time-of-day features.

---

## 📁 Project Structure

```
ADTRAFF/
├── data/
│   ├── nigerian_transport_and_logistics_traffic_flow.parquet  ← raw dataset (180k rows)
│   ├── train.csv          ← preprocessed training split (70%)
│   ├── val.csv            ← preprocessed validation split (15%)
│   └── test.csv           ← preprocessed test split (15%)
│
├── models/
│   ├── model_congestion_xgb.pkl    ← trained congestion index regressor
│   ├── model_eta_xgb.pkl           ← trained ETA (minute) regressor
│   ├── segment_label_encoder.pkl   ← LabelEncoder for segment_id
│   └── feature_scaler.pkl          ← MinMaxScaler for numeric features
│
└── scripts/
    ├── preprocess.py         ← Step 1: data cleaning + feature engineering
    ├── train_model.py        ← Step 2: XGBoost model training
    ├── best_time_model.py    ← Step 3: inference with manual segment list
    └── best_time_latlng.py   ← Step 3: inference with lat/lon coordinates
```

---

## 📊 The Dataset

**Source**: `electricsheepafrica/nigerian_transport_and_logistics_traffic_flow` (HuggingFace)  
**Local File**: `data/nigerian_transport_and_logistics_traffic_flow.parquet`

| Column | Type | Description |
|---|---|---|
| `timestamp` | datetime | Time the observation was recorded |
| `hour` | int | Hour of day (0–23) |
| `segment_id` | string | Unique road segment identifier (e.g. `SEG-0075626`) |
| `lat` | float | Latitude of the road segment midpoint |
| `lon` | float | Longitude of the road segment midpoint |
| `avg_speed_kmh` | float | Average vehicle speed on the segment (km/h) |
| `density_veh_per_km` | float | Vehicle density on the segment (vehicles per km) |
| `congestion_index` | float | A 0–100 numeric measure of congestion severity |
| `incidents` | int | Whether a traffic incident was reported (0 or 1) |

**Dataset scale after loading**: 180,000 rows | 9 columns  
**After cleaning**: ~172,943 rows (7,057 rows removed as outliers/nulls)  
**Unique road segments**: 115,958 segments encoded and indexed

---

## 🔧 Step 1: Preprocessing (`preprocess.py`)

### 1.1 Data Cleaning

```python
# Timestamp parsing
df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
df.dropna(subset=["timestamp"], inplace=True)

# Required column null check
required_cols = ["avg_speed_kmh", "density_veh_per_km", "congestion_index", "incidents", "lat", "lon"]
df.dropna(subset=required_cols, inplace=True)

# Outlier removal — top and bottom 1% per column (IQR clipping)
for col in ["avg_speed_kmh", "density_veh_per_km", "congestion_index"]:
    q1 = df[col].quantile(0.01)
    q99 = df[col].quantile(0.99)
    df = df[(df[col] >= q1) & (df[col] <= q99)]

# Clip incidents to binary 0/1
df["incidents"] = df["incidents"].clip(0, 1).astype(int)
```

### 1.2 Feature Engineering

All new features are derived from existing columns:

#### 🕰️ Cyclical Temporal Encoding

Hours and days of the week are **cyclical** — hour 23 is adjacent to hour 0, and Sunday is adjacent to Monday. Simply using raw integers would mislead the model into thinking there's a large distance between these values. To fix this, we apply **sine and cosine transforms**:

```python
df["sin_hour"] = np.sin(2 * np.pi * df["hour"] / 24)   # cyclical hour
df["cos_hour"] = np.cos(2 * np.pi * df["hour"] / 24)

df["day_of_week"] = df["timestamp"].dt.dayofweek        # Mon=0, Sun=6
df["sin_dow"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
df["cos_dow"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
```

This ensures that the model perceives time as circular, not linear.

#### 📅 Calendar Features

```python
df["day_of_month"] = df["timestamp"].dt.day     # 1–31
df["month"] = df["timestamp"].dt.month          # 1–12
df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)  # 1 if Sat/Sun
```

#### 🕐 Time-of-Day Bucket

Each hour is mapped to a human-meaningful traffic period:

| Bucket | Hours | Label |
|---|---|---|
| 0 | 06:00–09:00 | Morning Rush |
| 1 | 10:00–15:00 | Midday |
| 2 | 16:00–19:00 | Evening Rush |
| 3 | 20:00–05:00 | Night / Off-Peak |

```python
def time_bucket(h):
    if 6 <= h <= 9:   return 0
    elif 10 <= h <= 15: return 1
    elif 16 <= h <= 19: return 2
    else:               return 3
```

#### 🚗 Interaction Features

These derived features capture the relationship between speed and density:

```python
# Road stress: high when both fast AND dense (conflicting forces)
df["speed_density"] = df["avg_speed_kmh"] * df["density_veh_per_km"]

# Efficiency: how much speed is retained relative to density
df["speed_efficiency"] = df["avg_speed_kmh"] / (df["density_veh_per_km"] + 1)
```

#### 🎯 Target Variable: ETA

The actual travel time in minutes for a 10 km road segment is derived from speed:

```python
SEGMENT_KM = 10
df["eta_minutes"] = (SEGMENT_KM / df["avg_speed_kmh"]) * 60
```

### 1.3 Encoding

#### Segment ID — Label Encoding

The `segment_id` string column (e.g., `"SEG-0075626"`) is converted to a numeric integer:

```python
le = LabelEncoder()
df["segment_encoded"] = le.fit_transform(df["segment_id"])
joblib.dump(le, "models/segment_label_encoder.pkl")
```

This maps each of the 115,958 unique segments to an integer `[0, 115957]`.

### 1.4 Feature Scaling

Continuous numeric features are scaled to the `[0, 1]` range using `MinMaxScaler` so they all have equal influence during gradient boosting:

```python
SCALE_COLS = ["lat", "lon", "density_veh_per_km", "avg_speed_kmh", "speed_density", "speed_efficiency"]
scaler = MinMaxScaler()
df[SCALE_COLS] = scaler.fit_transform(df[SCALE_COLS])
joblib.dump(scaler, "models/feature_scaler.pkl")
```

### 1.5 Final Feature List (16 features)

| Feature | Description |
|---|---|
| `sin_hour`, `cos_hour` | Cyclical hour encoding |
| `sin_dow`, `cos_dow` | Cyclical day-of-week encoding |
| `day_of_month` | Day of month (1–31) |
| `month` | Month (1–12) |
| `is_weekend` | Binary (1 = weekend) |
| `time_bucket` | Traffic period (0–3) |
| `lat`, `lon` | Scaled segment coordinates |
| `segment_encoded` | Integer-encoded segment ID |
| `density_veh_per_km` | Scaled vehicle density |
| `avg_speed_kmh` | Scaled average speed |
| `incidents` | Binary incident flag |
| `speed_density` | Scaled speed × density product |
| `speed_efficiency` | Scaled speed ÷ (density + 1) ratio |

### 1.6 Train / Validation / Test Split

```
172,943 rows total
  → Train : 121,060 rows  (70%)
  → Val   :  25,941 rows  (15%)
  → Test  :  25,942 rows  (15%)
```

### 1.7 Target Variable Statistics

```
congestion_index → mean = 37.34, std = 16.08
eta_minutes      → mean = 12.41, std =  5.51
```

This tells us the average Nigerian road segment experiences **light to moderate congestion** (~37 on a 0–100 scale), and takes about **12.4 minutes** to traverse at prevailing speeds.

---

## 🤖 Step 2: Model Training (`train_model.py`)

The project uses **two cascaded XGBoost Regressors** — one for congestion and one for ETA.

### Why XGBoost?

XGBoost (eXtreme Gradient Boosting) is an ensemble decision-tree algorithm that:
- Handles non-linear relationships between time features and congestion
- Is robust to unscaled categorical features (segment encodings)
- Supports early stopping to prevent overfitting
- Trains efficiently on large tabular datasets

### Model 1: Congestion Regressor

**Input**: 16 features (described above)  
**Output**: Continuous `congestion_index` (0–100)

```python
model_congestion = XGBRegressor(
    n_estimators=100,
    learning_rate=0.1,
    random_state=42,
    early_stopping_rounds=10
)
model_congestion.fit(X_train, y_train_cong, eval_set=[(X_val, y_val_cong)])
```

### Model 2: ETA Regressor

**Input**: 16 features + `pred_congestion` (17 features)  
**Output**: Continuous `eta_minutes`

The predicted congestion from Model 1 is **injected as an additional feature** when training Model 2. This creates a cascaded prediction chain:

```
16 features → Congestion Model → pred_congestion_index
                   ↓
(16 features + pred_congestion) → ETA Model → eta_minutes
```

This cascade is inspired by the physical relationship: _higher congestion → lower speed → higher ETA_.

```python
train_df["pred_congestion"] = model_congestion.predict(X_train)
val_df["pred_congestion"]   = model_congestion.predict(X_val)

model_eta = XGBRegressor(n_estimators=100, learning_rate=0.1, ...)
model_eta.fit(X_train[ETA_FEATURES], y_train_eta, ...)
```

### Artifacts Saved

| File | Size | Contents |
|---|---|---|
| `model_congestion_xgb.pkl` | ~359 KB | Trained congestion regressor |
| `model_eta_xgb.pkl` | ~449 KB | Trained ETA regressor |
| `segment_label_encoder.pkl` | ~1.5 MB | Label encoder for 115,958 segments |
| `feature_scaler.pkl` | ~1.2 KB | Min-max scaler for 6 numeric features |

---

## 🗺️ Step 3: Inference — Lat/Lon API (`best_time_latlng.py`)

This script transforms raw geographic coordinates into a best-departure-hour recommendation.

### Full Inference Pipeline

```
User Input: (start_lat, start_lon) → (end_lat, end_lon), time window
         ↓
1. Linear interpolation: draw N waypoints along the straight-line path
         ↓
2. BallTree spatial lookup: snap each waypoint to its nearest road segment
         ↓
3. Route assembly: a sequence of up to N unique segment dicts
         ↓
4. For each hour H in [start_hour .. end_hour]:
       a. Build a feature row per segment for hour H
       b. Apply MinMaxScaler to numeric columns  
       c. Congestion Model → congestion_index per segment
       d. ETA Model → eta_minutes per segment
       e. Sum ETA; average congestion
       f. Composite Score = 0.6 × Σ(ETA) + 0.4 × (avg_congestion/100) × Σ(ETA)
         ↓
5. Best hour = argmin(composite_score)
         ↓
Output: best_departure_hour, ETA, congestion level, segment detail
```

### The Composite Score Formula

```
Score = η_w × Σ(ETA) + c_w × (avg_congestion / 100) × Σ(ETA)
```

Where:
- `η_w = 0.6`  — ETA is the primary objective (travel time minimization)
- `c_w = 0.4`  — Congestion penalises comfort/reliability
- **Lower score = better departure time**

### Spatial Indexing with BallTree

Rather than brute-force nearest-neighbour search over all 118,941 road segments, we use a BallTree:

```python
# Build the spatial index once at startup
_coords_rad = np.radians(SEGMENT_DB[["lat", "lon"]].values)
SPATIAL_INDEX = BallTree(_coords_rad, metric="haversine")

# Query at runtime
dist_rad, idxs = SPATIAL_INDEX.query(np.radians([[lat, lon]]), k=1)
dist_km = dist_rad[0][0] * 6371   # convert radians → km
```

This gives `O(log n)` lookup time vs `O(n)` brute force, making real-time queries feasible.

### Congestion Level Mapping

| Congestion Index | Level |
|---|---|
| < 25 | 🟢 Free Flow |
| 25–44 | 🟡 Light |
| 45–64 | 🟠 Moderate |
| 65–79 | 🔴 Heavy |
| ≥ 80 | 🔴 Severe |

---

## 📈 Example Output Walk-Through

**From**: (6.5°N, 13.0°E) → **To**: (8.5°N, 14.5°E)  
**Date**: 2025-03-17 (Monday)  
**Window**: 06:00 to 21:00

```
🗺️  Straight-line distance: ~277.13 km
🛣️  Road segments matched: 6 (via waypoint interpolation)
```

**Hourly Scoring**:

| Hour | ETA (min) | Avg Congestion | Level | Score |
|---|---|---|---|---|
| 06:00 | 89.90 | 44.75 | Light | 70.03 |
| 07:00 | 89.91 | 46.27 | Moderate | 70.59 |
| 08:00 | 89.91 | 45.72 | Moderate | 70.39 |
| ... | ... | ... | ... | ... |
| **14:00** | **90.0** | **39.2** | **Light** | **67.xx** ← BEST |
| 16:00 | 89.91 | 42.21 | Light | 69.13 |
| 21:00 | 89.91 | 44.35 | Light | 69.90 |

**✅ Best Departure: 14:00 (2:00 PM)**

| Segment | Lat | Lon | Speed (km/h) | Congestion | ETA | Level |
|---|---|---|---|---|---|---|
| SEG-0075626 | 6.500 | 13.005 | 81.9 | 26.2 | 7.31 min | Light |
| SEG-0027115 | 6.885 | 13.310 | 83.9 | 25.4 | 7.15 min | Light |
| SEG-0081439 | 7.300 | 13.608 | 52.4 | 28.6 | 11.46 min | Light |
| SEG-0166025 | 7.698 | 13.899 | 64.8 | 32.2 | 9.27 min | Light |
| SEG-0076658 | 8.085 | 14.177 | 25.8 | 55.9 | 23.42 min | Moderate |
| SEG-0040247 | 8.510 | 14.481 | 19.0 | 67.1 | 31.35 min | **Heavy** |

The last two segments in this route (towards the destination) dominate the travel time due to slow speeds (19–25 km/h) and elevated congestion. These could indicate a major urban area, a bottleneck junction, or high density roads near the destination point.

---

## 🔁 How to Run (End-to-End)

```bash
# Step 0: Install dependencies
pip install pandas numpy scikit-learn xgboost joblib pyarrow scikit-learn

# Step 1: Preprocess data
cd scripts
python preprocess.py

# Step 2: Train the models
python train_model.py

# Step 3: Run the lat/lon best-time inference
python "best_time_latlng .py"
```

---

## ⚙️ Configuration Options

In `best_time_latlng.py`, you can customize:

```python
result = find_best_time(
    start_lat   = 6.5,          # source latitude
    start_lon   = 13.0,         # source longitude
    end_lat     = 8.5,          # destination latitude
    end_lon     = 14.5,         # destination longitude
    start_hour  = 6,            # departure window start (0–23)
    end_hour    = 21,           # departure window end (0–23)
    travel_date = date(2025, 3, 17),  # date of travel
    n_waypoints = 6,            # interpolation points along route
    eta_weight  = 0.6,          # priority weight for ETA
    cong_weight = 0.4,          # priority weight for congestion
)
```

---

## 🧠 Key Concepts Summary

| Concept | What We Did |
|---|---|
| Cyclical time encoding | Sine/cosine of hour and day-of-week |
| Segment encoding | LabelEncoder for 115k+ unique segment IDs |
| Feature scaling | MinMaxScaler for 6 continuous features |
| ETA proxy target | `(10 km / avg_speed) × 60` minutes |
| Congestion target | Raw `congestion_index` column (0–100) |
| Cascaded models | Congestion prediction fed as feature to ETA model |
| Spatial lookup | BallTree with Haversine metric for nearest road snap |
| Route building | Straight-line waypoint interpolation + deduplication |
| Hourly sweep | Predict every hour in window; pick lowest composite score |

---

*Built using Python, Pandas, Scikit-Learn, XGBoost, and NumPy.*
