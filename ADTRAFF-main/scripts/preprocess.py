import pandas as pd
import numpy as np
import requests
import joblib
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.model_selection import train_test_split


# ─────────────────────────────────────────
# 1. LOAD DATA FROM HUGGINGFACE API
# ─────────────────────────────────────────

def fetch_dataset(parquet_path):
    print(f"Loading data from {parquet_path}...")
    df = pd.read_parquet(parquet_path)
    print(f"Total rows loaded: {len(df)}")
    return df


# ─────────────────────────────────────────
# 2. BASIC CLEANING
# ─────────────────────────────────────────

def clean_data(df):
    print("\n[Clean] Shape before:", df.shape)

    # Parse timestamp
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")

    # Drop rows where timestamp could not be parsed
    df.dropna(subset=["timestamp"], inplace=True)

    # Drop full duplicates
    df.drop_duplicates(inplace=True)

    # Drop rows with any remaining nulls in key columns
    required_cols = ["avg_speed_kmh", "density_veh_per_km", "congestion_index", "incidents", "lat", "lon"]
    df.dropna(subset=required_cols, inplace=True)

    # Clip extreme outliers using IQR per numeric column
    numeric_cols = ["avg_speed_kmh", "density_veh_per_km", "congestion_index"]
    for col in numeric_cols:
        q1 = df[col].quantile(0.01)
        q99 = df[col].quantile(0.99)
        before = len(df)
        df = df[(df[col] >= q1) & (df[col] <= q99)]
        print(f"[Clean] {col}: removed {before - len(df)} outlier rows")

    # Ensure incidents is binary 0/1
    df["incidents"] = df["incidents"].clip(0, 1).astype(int)

    print("[Clean] Shape after:", df.shape)
    return df.reset_index(drop=True)


# ─────────────────────────────────────────
# 3. FEATURE ENGINEERING
# ─────────────────────────────────────────

def engineer_features(df):
    print("\n[Features] Engineering temporal features...")

    # Cyclical hour encoding (avoids 23 and 0 being far apart)
    df["sin_hour"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["cos_hour"] = np.cos(2 * np.pi * df["hour"] / 24)

    # Day-level features
    df["day_of_week"] = df["timestamp"].dt.dayofweek      # 0=Mon, 6=Sun
    df["day_of_month"] = df["timestamp"].dt.day
    df["month"] = df["timestamp"].dt.month
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

    # Time-of-day bucket (morning rush, midday, evening rush, night)
    def time_bucket(h):
        if 6 <= h <= 9:
            return 0   # morning rush
        elif 10 <= h <= 15:
            return 1   # midday
        elif 16 <= h <= 19:
            return 2   # evening rush
        else:
            return 3   # night / off-peak
    df["time_bucket"] = df["hour"].apply(time_bucket)

    # Cyclical encoding for day of week
    df["sin_dow"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
    df["cos_dow"] = np.cos(2 * np.pi * df["day_of_week"] / 7)

    # Interaction: speed × density (road stress indicator)
    df["speed_density"] = df["avg_speed_kmh"] * df["density_veh_per_km"]

    # Speed efficiency ratio (how much speed is lost relative to density)
    df["speed_efficiency"] = df["avg_speed_kmh"] / (df["density_veh_per_km"] + 1)

    # ETA target: proxy travel time in minutes assuming 10 km segment length
    # Replace 10 with actual segment distance if available
    SEGMENT_KM = 10
    df["eta_minutes"] = (SEGMENT_KM / df["avg_speed_kmh"]) * 60

    print("[Features] Done. New columns added:")
    new_cols = [
        "sin_hour", "cos_hour", "day_of_week", "day_of_month",
        "month", "is_weekend", "time_bucket", "sin_dow", "cos_dow",
        "speed_density", "speed_efficiency", "eta_minutes"
    ]
    print(" ", new_cols)
    return df


# ─────────────────────────────────────────
# 4. ENCODE CATEGORICAL FEATURES
# ─────────────────────────────────────────

def encode_categoricals(df):
    print("\n[Encode] Encoding segment_id with LabelEncoder...")
    le = LabelEncoder()
    df["segment_encoded"] = le.fit_transform(df["segment_id"])
    joblib.dump(le, "segment_label_encoder.pkl")
    print(f"[Encode] {df['segment_id'].nunique()} unique segments encoded.")
    return df, le


# ─────────────────────────────────────────
# 5. SCALE NUMERIC FEATURES
# ─────────────────────────────────────────

def scale_features(df, feature_cols):
    print("\n[Scale] Applying MinMaxScaler to numeric features...")
    scaler = MinMaxScaler()
    df[feature_cols] = scaler.fit_transform(df[feature_cols])
    joblib.dump(scaler, "feature_scaler.pkl")
    print("[Scale] Done.")
    return df, scaler


# ─────────────────────────────────────────
# 6. SPLIT INTO TRAIN / VALIDATION / TEST
# ─────────────────────────────────────────

def split_data(df, feature_cols, target_congestion="congestion_index", target_eta="eta_minutes"):
    print("\n[Split] Splitting into train / val / test (70/15/15)...")

    X = df[feature_cols]
    y_congestion = df[target_congestion]
    y_eta = df[target_eta]

    X_train, X_temp, yc_train, yc_temp, ye_train, ye_temp = train_test_split(
        X, y_congestion, y_eta, test_size=0.30, random_state=42
    )
    X_val, X_test, yc_val, yc_test, ye_val, ye_test = train_test_split(
        X_temp, yc_temp, ye_temp, test_size=0.50, random_state=42
    )

    print(f"  Train : {len(X_train)} rows")
    print(f"  Val   : {len(X_val)} rows")
    print(f"  Test  : {len(X_test)} rows")

    return (
        X_train, X_val, X_test,
        yc_train, yc_val, yc_test,
        ye_train, ye_val, ye_test
    )


# ─────────────────────────────────────────
# 7. SAVE PROCESSED DATA
# ─────────────────────────────────────────

def save_splits(X_train, X_val, X_test, yc_train, yc_val, yc_test, ye_train, ye_val, ye_test):
    print("\n[Save] Saving processed splits to CSV...")
    X_train.assign(congestion_index=yc_train.values, eta_minutes=ye_train.values).to_csv("train.csv", index=False)
    X_val.assign(congestion_index=yc_val.values, eta_minutes=ye_val.values).to_csv("val.csv", index=False)
    X_test.assign(congestion_index=yc_test.values, eta_minutes=ye_test.values).to_csv("test.csv", index=False)
    print("  Saved: train.csv, val.csv, test.csv")


# ─────────────────────────────────────────
# 8. SUMMARY REPORT
# ─────────────────────────────────────────

def print_summary(df, feature_cols):
    print("\n" + "="*50)
    print("PREPROCESSING SUMMARY")
    print("="*50)
    print(f"Total rows         : {len(df)}")
    print(f"Feature columns    : {len(feature_cols)}")
    print(f"Null values left   : {df[feature_cols].isnull().sum().sum()}")
    print(f"\nFeature list:")
    for f in feature_cols:
        print(f"  - {f}")
    print(f"\nTarget stats:")
    print(f"  congestion_index → mean={df['congestion_index'].mean():.2f}, std={df['congestion_index'].std():.2f}")
    print(f"  eta_minutes      → mean={df['eta_minutes'].mean():.2f}, std={df['eta_minutes'].std():.2f}")
    print("="*50)


# ─────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────

if __name__ == "__main__":

    # Step 1: Load data from local parquet file
    df = fetch_dataset(r"c:\Users\KIIT0001\Desktop\ADTRAFF\data\nigerian_transport_and_logistics_traffic_flow.parquet")

    # Step 2: Clean
    df = clean_data(df)

    # Step 3: Engineer features
    df = engineer_features(df)

    # Step 4: Encode categoricals
    df, label_encoder = encode_categoricals(df)

    # Step 5: Define feature columns to use for training
    FEATURE_COLS = [
        "sin_hour", "cos_hour",
        "sin_dow", "cos_dow",
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

    # Step 6: Scale numeric features (exclude binary/encoded)
    SCALE_COLS = [
        "lat", "lon",
        "density_veh_per_km",
        "avg_speed_kmh",
        "speed_density",
        "speed_efficiency",
    ]
    df, scaler = scale_features(df, SCALE_COLS)

    # Step 7: Print summary before splitting
    print_summary(df, FEATURE_COLS)

    # Step 8: Split
    (
        X_train, X_val, X_test,
        yc_train, yc_val, yc_test,
        ye_train, ye_val, ye_test
    ) = split_data(df, FEATURE_COLS)

    # Step 9: Save
    save_splits(X_train, X_val, X_test, yc_train, yc_val, yc_test, ye_train, ye_val, ye_test)

    print("\nPreprocessing complete. Artifacts saved:")
    print("  train.csv, val.csv, test.csv")
    print("  segment_label_encoder.pkl")
    print("  feature_scaler.pkl")
