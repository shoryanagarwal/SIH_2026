import os
import sys
from pathlib import Path
from typing import List

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


# PATHS — adjust ONLY 

# This file lives at SIH_2026/ml_service/main.py, so parents[1] is SIH_2026/
PROJECT_ROOT = Path(__file__).resolve().parents[1]

TRACEX_ROOT = PROJECT_ROOT / "TraceX-AI"
TRACEX_SRC = TRACEX_ROOT / "src"
DL_ROOT = PROJECT_ROOT / "DL"

ISOLATION_FOREST_PATH = TRACEX_ROOT / "models" / "isolation_forest_pipeline.joblib"


LSTM_MODEL_FILENAME = os.environ.get("LSTM_MODEL_FILENAME", "final_lstm_log_model.keras")

X_SCALER_PATH = DL_ROOT / "x_scaler.pkl"
Y_SCALER_PATH = DL_ROOT / "y_scaler.pkl"
LEAKAGE_LOG_PARAMS_PATH = DL_ROOT / "leakage_log_params.pkl"



# Index of "Leakage" within the 4 predictor parameters. Used to apply the log-inverse transform if requested.
PARAM_ORDER = ["Temperature", "VCE", "Leakage", "Breakdown"]
LEAKAGE_INDEX = PARAM_ORDER.index("Leakage")

STAGES = ["0h", "24h", "48h", "96h"]

if str(TRACEX_SRC) not in sys.path:
    sys.path.insert(0, str(TRACEX_SRC))



# LOAD MODEL 1 — ISOLATION FOREST (real anomaly detector)

if not ISOLATION_FOREST_PATH.exists():
    raise FileNotFoundError(f"Isolation Forest pipeline not found: {ISOLATION_FOREST_PATH}")

from feature_engineering.create_features import create_features  # noqa: E402

_if_bundle = joblib.load(ISOLATION_FOREST_PATH)
_if_pipeline = _if_bundle["pipeline"]
_if_feature_columns = _if_bundle["feature_columns"]

print(f"[ml_service] Isolation Forest loaded. {len(_if_feature_columns)} expected features.")



# LOAD MODEL 2 — LSTM (real 168h predictor)


from tensorflow.keras.models import load_model  # noqa: E402

_lstm_model_path = DL_ROOT / LSTM_MODEL_FILENAME
if not _lstm_model_path.exists():
    raise FileNotFoundError(
        f"LSTM model not found at {_lstm_model_path}. "
        f"Run `ls {DL_ROOT}` and set LSTM_MODEL_FILENAME env var to the real filename."
    )

_lstm_model = load_model(_lstm_model_path)
_x_scaler = joblib.load(X_SCALER_PATH)
_y_scaler = joblib.load(Y_SCALER_PATH)

_leakage_log_params = None
if LEAKAGE_LOG_PARAMS_PATH.exists():
    _leakage_log_params = joblib.load(LEAKAGE_LOG_PARAMS_PATH)

print(f"[ml_service] LSTM loaded from {LSTM_MODEL_FILENAME}. "
      f"Leakage log-inverse: {'ON' if _leakage_log_params is not None else 'OFF'}.")



app = FastAPI(title="TRACE-X AI ML Service")


class ComponentInput(BaseModel):
    component_id: str
    lot_id: str
    Temperature: List[float] = Field(..., min_items=4, max_items=4)
    VCE: List[float] = Field(..., min_items=4, max_items=4)
    Leakage: List[float] = Field(..., min_items=4, max_items=4)
    Breakdown: List[float] = Field(..., min_items=4, max_items=4)


@app.get("/health")
def health():
    return {"success": True, "status": "online", "service": "TRACE-X ML Service"}


@app.post("/anomaly")
def anomaly(payload: ComponentInput):
    """
    Direct wrap of your analyze_component(). Same feature pipeline,
    same Isolation Forest, same decision_function call. The only
    change: raw score is returned alongside the 0-100 display score
    so Node can do batch-relative rescaling (see note #5 above) --
    the model output itself is untouched.
    """
    component_data = {
        "Temperature": payload.Temperature,
        "VCE": payload.VCE,
        "Leakage": payload.Leakage,
        "Breakdown": payload.Breakdown,
    }

    for parameter, values in component_data.items():
        if len(values) != len(STAGES):
            raise HTTPException(
                status_code=400,
                detail=f"{parameter} must contain exactly {len(STAGES)} values for {STAGES}.",
            )

    features_df = create_features(component_data)

    if list(features_df.columns) != list(_if_feature_columns):
        raise HTTPException(
            status_code=500,
            detail=(
                "Feature mismatch. Model expects "
                f"{len(_if_feature_columns)} features, generated {len(features_df.columns)}. "
                "Feature engineering used here and at training time must be identical."
            ),
        )

    anomaly_score_raw = float(-_if_pipeline.decision_function(features_df)[0])
    prediction = _if_pipeline.predict(features_df)[0]

    # --- CHANGED: calibrated linear scale instead of the blind raw*100 ---
    # NOT YET VERIFIED against your real data's actual raw-score range.
    # Confirm by POSTing several real components to this endpoint and
    # checking anomaly_score_raw actually falls inside [-0.05, 0.10]
    # before trusting this in a demo.
    display_score = 100 / (1 + np.exp(-40 * (anomaly_score_raw - 0.01)))
    # --- END CHANGE ---

    status = "NORMAL" if prediction == 1 else "HIGH ANOMALY"

    return {
        "component_id": payload.component_id,
        "lot_id": payload.lot_id,
        "anomaly_score_raw": anomaly_score_raw,   # unscaled decision_function output — Node uses this for batch-relative rescaling
        "anomaly_score": round(display_score, 2),  # naive 0-100 scaling, kept for reference only
        "anomaly_status": status,
    }


@app.post("/predict168")
def predict168(payload: ComponentInput):
    """
    Direct wrap of predict_168h(). Builds the 16-value input in the
    exact order your reshape(-1, 4, 4) expects: 4 stages x 4 params,
    stage-major (all 4 params at 0h, then all 4 at 24h, etc.) since
    that's what create_features/dict-order implies. CONFIRM this
    ordering against diagnostic step 3 if predictions look nonsensical --
    if the LSTM was trained param-major instead, this needs a swap.
    """
    input_16 = []
    for i in range(len(STAGES)):
        for param in PARAM_ORDER:
            values = getattr(payload, param)
            if len(values) != len(STAGES):
                raise HTTPException(
                    status_code=400,
                    detail=f"{param} must contain exactly {len(STAGES)} values.",
                )
            input_16.append(values[i])

    input_arr = np.array(input_16, dtype=float).reshape(1, -1)

    if input_arr.shape[1] != 16:
        raise HTTPException(status_code=500, detail="Expected 16 input values after assembly.")

    input_scaled = _x_scaler.transform(input_arr)
    input_lstm = input_scaled.reshape(-1, 4, 4)

    prediction_scaled = _lstm_model.predict(input_lstm, verbose=0)
    prediction = _y_scaler.inverse_transform(prediction_scaled)

    # Leakage cannot be negative
    prediction[:, LEAKAGE_INDEX] = np.maximum(prediction[:, LEAKAGE_INDEX], 0)

    prediction[:, LEAKAGE_INDEX] = np.maximum(
    prediction[:, LEAKAGE_INDEX], 0
)
    values_168h = {param: float(prediction[0, idx]) for idx, param in enumerate(PARAM_ORDER)}

    return {
        "component_id": payload.component_id,
        "lot_id": payload.lot_id,
        "predicted_168h": values_168h,
    }