import pandas as pd
import joblib
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error
import os

# Define the absolute directories relative to the script
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
MODELS_DIR = os.path.join(PROJECT_ROOT, "models")

if __name__ == "__main__":
    print(f"Loading data from {DATA_DIR}...")
    train_df = pd.read_csv(os.path.join(DATA_DIR, "train.csv"))
    val_df = pd.read_csv(os.path.join(DATA_DIR, "val.csv"))

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

    X_train = train_df[FEATURE_COLS]
    y_train_cong = train_df["congestion_index"]
    y_train_eta = train_df["eta_minutes"]

    X_val = val_df[FEATURE_COLS]
    y_val_cong = val_df["congestion_index"]
    y_val_eta = val_df["eta_minutes"]

    # 1. Train Congestion Model
    print("\n[1/2] Training Congestion Model...")
    model_congestion = XGBRegressor(n_estimators=100, learning_rate=0.1, random_state=42, early_stopping_rounds=10)
    model_congestion.fit(X_train, y_train_cong, eval_set=[(X_val, y_val_cong)], verbose=True)

    preds_cong = model_congestion.predict(X_val)
    print(f"-> Congestion Validation MAE: {mean_absolute_error(y_val_cong, preds_cong):.2f}")

    model_cong_path = os.path.join(MODELS_DIR, "model_congestion_xgb.pkl")
    joblib.dump(model_congestion, model_cong_path)
    print(f"-> Saved: {model_cong_path}")

    # 2. Train ETA Model (ETA uses predicted congestion as a feature)
    print("\n[2/2] Training ETA Model...")
    train_df["pred_congestion"] = model_congestion.predict(X_train)
    val_df["pred_congestion"] = preds_cong

    X_train_eta = train_df[ETA_FEATURES]
    X_val_eta = val_df[ETA_FEATURES]

    model_eta = XGBRegressor(n_estimators=100, learning_rate=0.1, random_state=42, early_stopping_rounds=10)
    model_eta.fit(X_train_eta, y_train_eta, eval_set=[(X_val_eta, y_val_eta)], verbose=True)

    preds_eta = model_eta.predict(X_val_eta)
    print(f"-> ETA Validation MAE: {mean_absolute_error(y_val_eta, preds_eta):.2f}")

    model_eta_path = os.path.join(MODELS_DIR, "model_eta_xgb.pkl")
    joblib.dump(model_eta, model_eta_path)
    print(f"-> Saved: {model_eta_path}")

    print("\nTraining completed successfully! You can now run `best_time_model.py`.")
