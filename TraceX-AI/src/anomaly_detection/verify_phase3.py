from pathlib import Path
import sys

import joblib
import numpy as np
import pandas as pd


# ============================================================
# ADD SRC TO PYTHON PATH
# ============================================================

SRC_PATH = Path(__file__).resolve().parents[1]

if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))


# ============================================================
# IMPORT FEATURE ENGINEERING
# ============================================================

from feature_engineering.create_features import (
    create_features,
    get_expected_feature_columns
)


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_ROOT
    / "models"
    / "isolation_forest_pipeline.joblib"
)

RESULTS_DIR = PROJECT_ROOT / "results"

TRAIN_SCORES_PATH = (
    RESULTS_DIR / "train_anomaly_scores.csv"
)

VALIDATION_SCORES_PATH = (
    RESULTS_DIR / "validation_anomaly_scores.csv"
)

TEST_SCORES_PATH = (
    RESULTS_DIR / "test_anomaly_scores.csv"
)

METRICS_PATH = (
    RESULTS_DIR / "isolation_forest_metrics.csv"
)


# ============================================================
# CONSTANTS
# ============================================================

EXPECTED_FEATURE_COUNT = 48

STAGES = ["0h", "24h", "48h", "96h"]

PARAMETERS = [
    "Temperature",
    "VCE",
    "Leakage",
    "Breakdown"
]


# ============================================================
# ACTUAL DATASET COLUMN MAPPING
# ============================================================

COLUMN_MAP = {

    "Temperature": {
        "0h": "Temperature_C_0h",
        "24h": "Temperature_C_24h",
        "48h": "Temperature_C_48h",
        "96h": "Temperature_C_96h",
        "168h": "Temperature_C_168h",
    },

    "VCE": {
        "0h": "VCE_0h",
        "24h": "VCE_24h",
        "48h": "VCE_48h",
        "96h": "VCE_96h",
        "168h": "VCE_168h",
    },

    "Leakage": {
        "0h": "Leakage_uA_0h",
        "24h": "Leakage_uA_24h",
        "48h": "Leakage_uA_48h",
        "96h": "Leakage_uA_96h",
        "168h": "Leakage_uA_168h",
    },

    "Breakdown": {
        "0h": "Breakdown_V_0h",
        "24h": "Breakdown_V_24h",
        "48h": "Breakdown_V_48h",
        "96h": "Breakdown_V_96h",
        "168h": "Breakdown_V_168h",
    }
}


# ============================================================
# HELPER
# ============================================================

def check(condition, message):

    if not condition:
        raise AssertionError(message)

    print(f"PASS: {message}")


# ============================================================
# START
# ============================================================

print("=" * 70)
print("              TRACEX-AI - PHASE 3 VERIFICATION")
print("=" * 70)


# ============================================================
# CHECK MODEL
# ============================================================

print("\n[1] Checking trained model...")

check(
    MODEL_PATH.exists(),
    "Isolation Forest model file exists."
)

model_data = joblib.load(MODEL_PATH)

check(
    "pipeline" in model_data,
    "Pipeline exists inside model file."
)

check(
    "feature_columns" in model_data,
    "Feature column list exists inside model file."
)

pipeline = model_data["pipeline"]

feature_columns = model_data["feature_columns"]

check(
    len(feature_columns) == EXPECTED_FEATURE_COUNT,
    f"Model contains exactly {EXPECTED_FEATURE_COUNT} features."
)

print(f"Model features: {len(feature_columns)}")


# ============================================================
# CHECK FEATURE ENGINEERING
# ============================================================

print("\n[2] Checking feature engineering...")

expected_features = get_expected_feature_columns()

check(
    len(expected_features) == EXPECTED_FEATURE_COUNT,
    "Feature engineering generates exactly 48 features."
)

check(
    feature_columns == expected_features,
    "Training feature order matches feature-engineering order."
)

check(
    not any("168h" in feature for feature in feature_columns),
    "No 168h feature is present in the Isolation Forest input."
)


# ============================================================
# CREATE TEST COMPONENT
# ============================================================

print("\n[3] Testing early-burn-in feature generation...")

test_component = {

    "Temperature": [
        25.0,
        25.2,
        25.5,
        25.8
    ],

    "VCE": [
        5.0,
        5.01,
        5.02,
        5.03
    ],

    "Leakage": [
        10.0,
        10.5,
        11.0,
        11.5
    ],

    "Breakdown": [
        80.0,
        79.8,
        79.5,
        79.2
    ]
}


test_features = create_features(test_component)


check(
    test_features.shape == (1, EXPECTED_FEATURE_COUNT),
    "Test component produces exactly 48 features."
)

check(
    list(test_features.columns) == feature_columns,
    "Test feature columns match trained model columns."
)

check(
    not any("168h" in column for column in test_features.columns),
    "Generated test features contain no 168h information."
)

check(
    np.isfinite(test_features.to_numpy()).all(),
    "All generated feature values are finite."
)


# ============================================================
# TEST MODEL PREDICTION
# ============================================================

print("\n[4] Testing Isolation Forest prediction...")

prediction = pipeline.predict(test_features)

decision_score = pipeline.decision_function(test_features)

anomaly_score = -decision_score[0]

check(
    prediction[0] in [-1, 1],
    "Isolation Forest returned a valid prediction."
)

check(
    np.isfinite(anomaly_score),
    "Anomaly score is finite."
)

print(f"Test prediction   : {prediction[0]}")
print(f"Test anomaly score: {anomaly_score:.6f}")


# ============================================================
# CHECK RESULT FILES
# ============================================================

print("\n[5] Checking result files...")

result_files = [
    TRAIN_SCORES_PATH,
    VALIDATION_SCORES_PATH,
    TEST_SCORES_PATH,
    METRICS_PATH
]

for file_path in result_files:

    check(
        file_path.exists(),
        f"Result file exists: {file_path.name}"
    )


# ============================================================
# CHECK SCORE FILES
# ============================================================

print("\n[6] Checking anomaly score outputs...")

score_files = [
    TRAIN_SCORES_PATH,
    VALIDATION_SCORES_PATH,
    TEST_SCORES_PATH
]

for file_path in score_files:

    df = pd.read_csv(file_path)

    print(f"\n{file_path.name}")
    print(f"Rows: {len(df)}")

    # --------------------------------------------------------
    # Check anomaly score column
    # --------------------------------------------------------

    check(
        "Anomaly_Score" in df.columns,
        f"{file_path.name} contains Anomaly_Score."
    )

    # --------------------------------------------------------
    # Check anomaly scores are finite
    # --------------------------------------------------------

    check(
        np.isfinite(
            df["Anomaly_Score"].to_numpy()
        ).all(),
        f"{file_path.name} anomaly scores are finite."
    )

    # --------------------------------------------------------
    # Prediction column is optional
    # --------------------------------------------------------

    if "Prediction" in df.columns:

        check(
            df["Prediction"].isin([-1, 1]).all(),
            f"{file_path.name} predictions are valid."
        )

    else:

        print(
            f"INFO: {file_path.name} does not contain "
            f"'Prediction'. This is acceptable."
        )


# ============================================================
# CHECK METRICS
# ============================================================

print("\n[7] Checking evaluation metrics...")

metrics_df = pd.read_csv(METRICS_PATH)

required_metrics = [
    "Dataset",
    "Samples",
    "ROC_AUC",
    "Average_Precision",
    "Precision",
    "Recall",
    "F1_Score"
]

for column in required_metrics:

    check(
        column in metrics_df.columns,
        f"Metrics file contains {column}."
    )


# ============================================================
# CHECK RAW 168h COLUMNS
# ============================================================

print("\n[8] Verifying 168h is retained only as raw/evaluation data...")

train_path = PROJECT_ROOT / "processed_data" / "train.csv"

check(
    train_path.exists(),
    "Training dataset exists."
)

train_df = pd.read_csv(train_path)

for parameter in PARAMETERS:

    column = COLUMN_MAP[parameter]["168h"]

    check(
        column in train_df.columns,
        f"Raw 168h column exists: {column}"
    )


# ============================================================
# FINAL CHECK
# ============================================================

print("\n" + "=" * 70)
print("                 PHASE 3 VERIFICATION")
print("=" * 70)

print("\nALL CHECKS PASSED.")

print("\nIsolation Forest configuration:")
print("  Input stages : 0h, 24h, 48h, 96h")
print("  Parameters   : Temperature, VCE, Leakage, Breakdown")
print("  Features     : 48")
print("  168h input   : NOT USED")
print("  Algorithm    : Isolation Forest")

print("\nPhase 3 is complete.")
print("=" * 70)