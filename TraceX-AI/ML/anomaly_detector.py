from pathlib import Path
import sys

import joblib


# ============================================================
# ADD SRC TO PYTHON PATH
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_PATH = PROJECT_ROOT / "src"

if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))


# ============================================================
# IMPORT FEATURE ENGINEERING
# ============================================================

from feature_engineering.create_features import create_features


# ============================================================
# PATHS
# ============================================================

MODEL_PATH = (
    PROJECT_ROOT
    / "models"
    / "isolation_forest_pipeline.joblib"
)


# ============================================================
# EARLY BURN-IN STAGES
# ============================================================

STAGES = ["0h", "24h", "48h", "96h"]


# ============================================================
# LOAD MODEL
# ============================================================

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Model not found:\n{MODEL_PATH}\n\n"
        "Run train_isolation_forest.py first."
    )

model_data = joblib.load(MODEL_PATH)

pipeline = model_data["pipeline"]
feature_columns = model_data["feature_columns"]


# ============================================================
# ANALYZE COMPONENT
# ============================================================

def analyze_component(data):
    """
    Analyze one electronic component using early burn-in data.

    Required input:
        {
            "component_id": "...",
            "lot_id": "...",
            "Temperature": [0h, 24h, 48h, 96h],
            "VCE": [0h, 24h, 48h, 96h],
            "Leakage": [0h, 24h, 48h, 96h],
            "Breakdown": [0h, 24h, 48h, 96h]
        }

    168h is intentionally NOT used for inference.
    """

    # ========================================================
    # GET COMPONENT INFORMATION
    # ========================================================

    component_id = data["component_id"]
    lot_id = data["lot_id"]

    # ========================================================
    # GET EARLY BURN-IN MEASUREMENTS
    # ========================================================

    component_data = {
        "Temperature": data["Temperature"],
        "VCE": data["VCE"],
        "Leakage": data["Leakage"],
        "Breakdown": data["Breakdown"],
    }

    # ========================================================
    # VALIDATE INPUT LENGTH
    # ========================================================

    for parameter in component_data:

        if len(component_data[parameter]) != len(STAGES):

            raise ValueError(
                f"{parameter} must contain exactly "
                f"{len(STAGES)} values for "
                f"{STAGES}."
            )

    # ========================================================
    # CREATE ENGINEERED FEATURES
    # ========================================================

    features_df = create_features(component_data)

    # ========================================================
    # VERIFY FEATURE STRUCTURE
    # ========================================================

    if list(features_df.columns) != list(feature_columns):

        raise ValueError(
            "\nFeature mismatch!\n\n"
            f"Model expects {len(feature_columns)} features.\n"
            f"Generated {len(features_df.columns)} features.\n\n"
            "The feature engineering used for training and "
            "testing must be identical."
        )

    # ========================================================
    # RUN ISOLATION FOREST
    # ========================================================

    anomaly_score_raw = (
        -pipeline.decision_function(features_df)[0]
    )

    prediction = pipeline.predict(features_df)[0]

    # ========================================================
    # CONVERT SCORE TO DISPLAY SCORE
    # ========================================================

    # This is a DISPLAY score, not a probability.
    # Higher value = more anomalous.

    score = max(
        0,
        min(
            100,
            anomaly_score_raw * 100
        )
    )

    # ========================================================
    # DETERMINE STATUS
    # ========================================================

    if prediction == 1:
        status = "NORMAL"
    else:
        status = "HIGH ANOMALY"

    # ========================================================
    # RETURN RESULT FOR FASTAPI
    # ========================================================

    return {
        "component_id": component_id,
        "lot_id": lot_id,
        "anomaly_score": round(float(score), 2),
        "anomaly_status": status,
    }


# ============================================================
# LOCAL TEST
# ============================================================

if __name__ == "__main__":

    print("=" * 70)
    print("          TRACEX-AI - ANOMALY DETECTOR TEST")
    print("=" * 70)

    test_data = {
        "component_id": "TEST-001",
        "lot_id": "LOT-001",

        "Temperature": [
            128,
            130,
            134,
            140
        ],

        "VCE": [
            1,
            1.8,
            3,
            5
        ],

        "Leakage": [
            10,
            80,
            500,
            5000
        ],

        "Breakdown": [
            605,
            580,
            550,
            510
        ],
    }

    result = analyze_component(test_data)

    print("\nAnalysis Result:")
    print(result)

    print("\n" + "=" * 70)