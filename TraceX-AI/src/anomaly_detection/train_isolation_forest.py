from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    precision_score,
    recall_score,
    f1_score
)

# Import our new 0h/24h/48h/96h feature engineering
import sys

SRC_PATH = Path(__file__).resolve().parents[1]

if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

from feature_engineering.create_features import create_features


# ============================================================
# TRACEX-AI - ISOLATION FOREST TRAINING
# ============================================================

print("=" * 70)
print("                 TRACEX-AI")
print("          ISOLATION FOREST TRAINING")
print("=" * 70)


# ============================================================
# 1. PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

PROCESSED_DIR = PROJECT_ROOT / "processed_data"
MODEL_DIR = PROJECT_ROOT / "models"
RESULTS_DIR = PROJECT_ROOT / "results"

MODEL_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)

TRAIN_PATH = PROCESSED_DIR / "train.csv"
VALIDATION_PATH = PROCESSED_DIR / "validation.csv"
TEST_PATH = PROCESSED_DIR / "test.csv"

MODEL_PATH = MODEL_DIR / "isolation_forest_pipeline.joblib"

TRAIN_SCORES_PATH = RESULTS_DIR / "train_anomaly_scores.csv"
VALIDATION_SCORES_PATH = RESULTS_DIR / "validation_anomaly_scores.csv"
TEST_SCORES_PATH = RESULTS_DIR / "test_anomaly_scores.csv"

METRICS_PATH = RESULTS_DIR / "isolation_forest_metrics.csv"


# ============================================================
# 2. SETTINGS
# ============================================================

RANDOM_SEED = 42
N_ESTIMATORS = 300
CONTAMINATION = "auto"


# ============================================================
# 3. LOAD DATA
# ============================================================

print("\nLoading processed datasets...")

if not TRAIN_PATH.exists():
    raise FileNotFoundError(
        f"Training dataset not found:\n{TRAIN_PATH}"
    )

if not VALIDATION_PATH.exists():
    raise FileNotFoundError(
        f"Validation dataset not found:\n{VALIDATION_PATH}"
    )

if not TEST_PATH.exists():
    raise FileNotFoundError(
        f"Test dataset not found:\n{TEST_PATH}"
    )

train_df = pd.read_csv(TRAIN_PATH)
validation_df = pd.read_csv(VALIDATION_PATH)
test_df = pd.read_csv(TEST_PATH)

print(f"Training rows   : {len(train_df)}")
print(f"Validation rows : {len(validation_df)}")
print(f"Test rows       : {len(test_df)}")


# ============================================================
# 4. REQUIRED COLUMNS
# ============================================================

REQUIRED_COLUMNS = [
    "Component_ID",
    "Lot_ID",
    "True_Class"
]

PARAMETERS = [
    "Temperature",
    "VCE",
    "Leakage",
    "Breakdown"
]

STAGES = [
    "0h",
    "24h",
    "48h",
    "96h"
]


for column in REQUIRED_COLUMNS:

    if column not in train_df.columns:
        raise ValueError(
            f"Required column '{column}' missing from training data."
        )


# ============================================================
# 5. CHECK THAT 168h EXISTS BUT IS NOT USED
# ============================================================

print("\nChecking burn-in stages...")

# ============================================================
# ACTUAL DATASET COLUMN MAPPING
# ============================================================

COLUMN_MAP = {
    "Temperature": {
        "0h": "Temperature_C_0h",
        "24h": "Temperature_C_24h",
        "48h": "Temperature_C_48h",
        "96h": "Temperature_C_96h",
    },
    "VCE": {
        "0h": "VCE_0h",
        "24h": "VCE_24h",
        "48h": "VCE_48h",
        "96h": "VCE_96h",
    },
    "Leakage": {
        "0h": "Leakage_uA_0h",
        "24h": "Leakage_uA_24h",
        "48h": "Leakage_uA_48h",
        "96h": "Leakage_uA_96h",
    },
    "Breakdown": {
        "0h": "Breakdown_V_0h",
        "24h": "Breakdown_V_24h",
        "48h": "Breakdown_V_48h",
        "96h": "Breakdown_V_96h",
    },
}

print("Checking burn-in stages...")

for parameter in PARAMETERS:
    for stage in STAGES:
        column = COLUMN_MAP[parameter][stage]

        if column not in train_df.columns:
            raise ValueError(
                f"Required early-burn-in column missing: {column}"
            )

print("Early burn-in columns verified.")
print("Using only: 0h, 24h, 48h, 96h")
print("168h is NOT used for Isolation Forest inference.")


print("0h, 24h, 48h and 96h measurements found.")

# 168h should still exist in the raw processed dataset.
# ============================================================
# VERIFY 168h COLUMNS EXIST
# 168h is kept for evaluation / DL only.
# It is NOT used by Isolation Forest.
# ============================================================

EXPECTED_168H_COLUMNS = {
    "Temperature": "Temperature_C_168h",
    "VCE": "VCE_168h",
    "Leakage": "Leakage_uA_168h",
    "Breakdown": "Breakdown_V_168h",
}

for parameter, column in EXPECTED_168H_COLUMNS.items():

    if column not in train_df.columns:
        raise ValueError(
            f"Expected 168h column missing: {column}"
        )

print("168h columns found.")
print("168h will be retained for evaluation/DL only.")
print("168h will NOT be used for Isolation Forest.")

print("168h measurements found in dataset.")
print("168h will NOT be used for Isolation Forest inference.")


# ============================================================
# 6. FUNCTION TO CREATE ML FEATURES
# ============================================================

def build_feature_matrix(df):
    """
    Convert raw early-burn-in measurements into
    the 48 ML features required by Isolation Forest.
    """

    feature_rows = []

    for _, row in df.iterrows():

        component_data = {
    "Temperature": [
        row[COLUMN_MAP["Temperature"]["0h"]],
        row[COLUMN_MAP["Temperature"]["24h"]],
        row[COLUMN_MAP["Temperature"]["48h"]],
        row[COLUMN_MAP["Temperature"]["96h"]],
    ],

    "VCE": [
        row[COLUMN_MAP["VCE"]["0h"]],
        row[COLUMN_MAP["VCE"]["24h"]],
        row[COLUMN_MAP["VCE"]["48h"]],
        row[COLUMN_MAP["VCE"]["96h"]],
    ],

    "Leakage": [
        row[COLUMN_MAP["Leakage"]["0h"]],
        row[COLUMN_MAP["Leakage"]["24h"]],
        row[COLUMN_MAP["Leakage"]["48h"]],
        row[COLUMN_MAP["Leakage"]["96h"]],
    ],

    "Breakdown": [
        row[COLUMN_MAP["Breakdown"]["0h"]],
        row[COLUMN_MAP["Breakdown"]["24h"]],
        row[COLUMN_MAP["Breakdown"]["48h"]],
        row[COLUMN_MAP["Breakdown"]["96h"]],
    ],
}

        features = create_features(component_data)

        feature_rows.append(
            features.iloc[0].to_dict()
        )

    feature_df = pd.DataFrame(feature_rows)

    return feature_df


# ============================================================
# 7. CREATE TRAINING FEATURES
# ============================================================

print("\n" + "-" * 70)
print("FEATURE ENGINEERING")
print("-" * 70)

print("\nCreating training features...")

X_train = build_feature_matrix(train_df)

print(
    f"Training feature matrix: "
    f"{X_train.shape[0]} rows × {X_train.shape[1]} features"
)


# ============================================================
# 8. VERIFY FEATURE COUNT
# ============================================================

EXPECTED_FEATURE_COUNT = 48

if X_train.shape[1] != EXPECTED_FEATURE_COUNT:

    raise ValueError(
        f"Expected {EXPECTED_FEATURE_COUNT} features, "
        f"but received {X_train.shape[1]}."
    )

print("Feature count verified: 48")


# ============================================================
# 9. CHECK 168h IS NOT IN FEATURES
# ============================================================

features_containing_168h = [
    column
    for column in X_train.columns
    if "168h" in column
]

if features_containing_168h:

    raise ValueError(
        "168h features found in Isolation Forest input:\n"
        f"{features_containing_168h}"
    )

print("Verified: no 168h features are used.")


# ============================================================
# 10. CHECK FEATURE VALUES
# ============================================================

print("\nChecking training feature matrix...")

if X_train.isnull().any().any():

    raise ValueError(
        "Training feature matrix contains missing values."
    )


if not np.isfinite(
    X_train.to_numpy()
).all():

    raise ValueError(
        "Training feature matrix contains infinite values."
    )


print("Training feature matrix is valid.")


# ============================================================
# 11. BUILD ISOLATION FOREST PIPELINE
# ============================================================

print("\nBuilding Isolation Forest pipeline...")

pipeline = Pipeline(
    steps=[

        (
            "scaler",
            StandardScaler()
        ),

        (
            "isolation_forest",
            IsolationForest(
                n_estimators=N_ESTIMATORS,
                contamination=CONTAMINATION,
                random_state=RANDOM_SEED,
                n_jobs=-1
            )
        )
    ]
)


# ============================================================
# 12. TRAIN MODEL
# ============================================================

print("\nTraining Isolation Forest...")

pipeline.fit(X_train)

print("Training completed successfully.")


# ============================================================
# 13. FUNCTION TO GENERATE ANOMALY RESULTS
# ============================================================

def generate_results(df, feature_df):

    decision_scores = pipeline.decision_function(
        feature_df
    )

    anomaly_scores = -decision_scores

    predictions = pipeline.predict(
        feature_df
    )

    results = df[
        [
            "Component_ID",
            "Lot_ID",
            "True_Class"
        ]
    ].copy()

    results["Anomaly_Score"] = anomaly_scores

    results["IF_Prediction"] = predictions

    results["Predicted_Anomaly"] = (
        predictions == -1
    ).astype(int)

    return results


# ============================================================
# 14. TRAINING RESULTS
# ============================================================

print("\nGenerating training anomaly scores...")

train_results = generate_results(
    train_df,
    X_train
)

train_results.to_csv(
    TRAIN_SCORES_PATH,
    index=False
)

print(
    f"Saved:\n{TRAIN_SCORES_PATH}"
)


# ============================================================
# 15. VALIDATION FEATURES
# ============================================================

print("\nCreating validation features...")

X_validation = build_feature_matrix(
    validation_df
)

print(
    f"Validation feature matrix: "
    f"{X_validation.shape[0]} rows × "
    f"{X_validation.shape[1]} features"
)


if X_validation.shape[1] != EXPECTED_FEATURE_COUNT:

    raise ValueError(
        "Validation feature count is not 48."
    )


# ============================================================
# 16. VALIDATION RESULTS
# ============================================================

print("\nGenerating validation anomaly scores...")

validation_results = generate_results(
    validation_df,
    X_validation
)

validation_results.to_csv(
    VALIDATION_SCORES_PATH,
    index=False
)

print(
    f"Saved:\n{VALIDATION_SCORES_PATH}"
)


# ============================================================
# 17. TEST FEATURES
# ============================================================

print("\nCreating test features...")

X_test = build_feature_matrix(
    test_df
)

print(
    f"Test feature matrix: "
    f"{X_test.shape[0]} rows × "
    f"{X_test.shape[1]} features"
)


if X_test.shape[1] != EXPECTED_FEATURE_COUNT:

    raise ValueError(
        "Test feature count is not 48."
    )


# ============================================================
# 18. TEST RESULTS
# ============================================================

print("\nGenerating test anomaly scores...")

test_results = generate_results(
    test_df,
    X_test
)

test_results.to_csv(
    TEST_SCORES_PATH,
    index=False
)

print(
    f"Saved:\n{TEST_SCORES_PATH}"
)


# ============================================================
# 19. EVALUATION FUNCTION
# ============================================================

def calculate_metrics(results):

    # Convert:
    # NORMAL = 0
    # LATENT_DEFECT = 1
    # OBVIOUS_FAILURE = 1

    y_true = (
        results["True_Class"] != "NORMAL"
    ).astype(int)

    y_pred = results[
        "Predicted_Anomaly"
    ].astype(int)

    anomaly_score = results[
        "Anomaly_Score"
    ]


    roc_auc = roc_auc_score(
        y_true,
        anomaly_score
    )

    average_precision = average_precision_score(
        y_true,
        anomaly_score
    )

    precision = precision_score(
        y_true,
        y_pred,
        zero_division=0
    )

    recall = recall_score(
        y_true,
        y_pred,
        zero_division=0
    )

    f1 = f1_score(
        y_true,
        y_pred,
        zero_division=0
    )

    return {
        "ROC_AUC": roc_auc,
        "Average_Precision": average_precision,
        "Precision": precision,
        "Recall": recall,
        "F1_Score": f1
    }


# ============================================================
# 20. CALCULATE METRICS
# ============================================================

print("\n" + "-" * 70)
print("MODEL EVALUATION")
print("-" * 70)

train_metrics = calculate_metrics(
    train_results
)

validation_metrics = calculate_metrics(
    validation_results
)

test_metrics = calculate_metrics(
    test_results
)


metrics_df = pd.DataFrame(
    [
        {
            "Dataset": "Train",
            "Samples": len(train_results),
            **train_metrics
        },

        {
            "Dataset": "Validation",
            "Samples": len(validation_results),
            **validation_metrics
        },

        {
            "Dataset": "Test",
            "Samples": len(test_results),
            **test_metrics
        }
    ]
)


# ============================================================
# 21. DISPLAY METRICS
# ============================================================

print("\nModel metrics:")

print(
    metrics_df.to_string(
        index=False
    )
)


# ============================================================
# 22. SAVE METRICS
# ============================================================

metrics_df.to_csv(
    METRICS_PATH,
    index=False
)

print(
    f"\nMetrics saved to:\n{METRICS_PATH}"
)


# ============================================================
# 23. SAVE MODEL
# ============================================================

print("\nSaving trained model...")

joblib.dump(
    {
        "pipeline": pipeline,

        "feature_columns": X_train.columns.tolist(),

        "feature_count": len(
            X_train.columns
        ),

        "input_stages": [
            "0h",
            "24h",
            "48h",
            "96h"
        ],

        "parameters": PARAMETERS,

        "random_seed": RANDOM_SEED,

        "n_estimators": N_ESTIMATORS,

        "contamination": CONTAMINATION
    },

    MODEL_PATH
)


# ============================================================
# 24. TRAINING SUMMARY
# ============================================================

number_predicted_anomalies = int(
    train_results["Predicted_Anomaly"].sum()
)

anomaly_percentage = (
    number_predicted_anomalies
    / len(train_results)
) * 100


print("\n" + "=" * 70)
print("              TRAINING SUMMARY")
print("=" * 70)

print(
    f"Training samples       : {len(train_df)}"
)

print(
    f"Validation samples     : {len(validation_df)}"
)

print(
    f"Test samples           : {len(test_df)}"
)

print(
    f"ML features            : {X_train.shape[1]}"
)

print(
    f"Input stages           : 0h, 24h, 48h, 96h"
)

print(
    f"168h used for ML?      : NO"
)

print(
    f"Isolation trees        : {N_ESTIMATORS}"
)

print(
    f"Predicted anomalies    : "
    f"{number_predicted_anomalies}"
)

print(
    f"Training anomaly %     : "
    f"{anomaly_percentage:.2f}%"
)

print("\nModel saved to:")
print(MODEL_PATH)

print("\nResult files saved:")
print(TRAIN_SCORES_PATH)
print(VALIDATION_SCORES_PATH)
print(TEST_SCORES_PATH)
print(METRICS_PATH)

print("\n" + "=" * 70)
print("       PHASE 3 - MODEL TRAINING COMPLETE")
print("=" * 70)