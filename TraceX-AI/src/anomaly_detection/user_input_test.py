from pathlib import Path
import sys

import joblib
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

from feature_engineering.create_features import create_features


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = PROJECT_ROOT / "models" / "isolation_forest_pipeline.joblib"


# ============================================================
# EARLY BURN-IN STAGES
# ============================================================

STAGES = ["0h", "24h", "48h", "96h"]


# ============================================================
# LOAD MODEL
# ============================================================

print("=" * 70)
print("          TRACEX-AI - USER COMPONENT TEST")
print("=" * 70)

print("\nLoading trained Isolation Forest model...")

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Model not found:\n{MODEL_PATH}\n\n"
        "Run train_isolation_forest.py first."
    )

model_data = joblib.load(MODEL_PATH)

pipeline = model_data["pipeline"]
feature_columns = model_data["feature_columns"]

print("Model loaded successfully.")
print(f"Expected features : {len(feature_columns)}")


# ============================================================
# INPUT COMPONENT INFORMATION
# ============================================================

print("\n" + "=" * 70)
print("ENTER COMPONENT INFORMATION")
print("=" * 70)

component_id = input("Component ID: ").strip()
lot_id = input("Lot ID: ").strip()


# ============================================================
# ENTER EARLY BURN-IN MEASUREMENTS
# ============================================================

print("\nEnter measurements for:")
print("0h, 24h, 48h and 96h")
print("\nIMPORTANT: 168h is NOT required.")
print("The Isolation Forest performs early anomaly detection.")


def get_measurements(parameter_name):

    values = []

    print(f"\n{parameter_name}:")

    for stage in STAGES:

        while True:

            try:
                value = float(
                    input(f"  {stage}: ")
                )

                values.append(value)
                break

            except ValueError:
                print("  Please enter a valid number.")

    return values


temperature = get_measurements("Temperature")
vce = get_measurements("VCE")
leakage = get_measurements("Leakage")
breakdown = get_measurements("Breakdown Voltage")


# ============================================================
# CREATE COMPONENT DATA
# ============================================================

component_data = {
    "Temperature": temperature,
    "VCE": vce,
    "Leakage": leakage,
    "Breakdown": breakdown,
}


# ============================================================
# CREATE ENGINEERED FEATURES
# ============================================================

print("\nCreating early-burn-in features...")

features_df = create_features(component_data)


# ============================================================
# VERIFY FEATURE STRUCTURE
# ============================================================

if list(features_df.columns) != list(feature_columns):

    raise ValueError(
        "\nFeature mismatch!\n\n"
        f"Model expects {len(feature_columns)} features.\n"
        f"Generated {len(features_df.columns)} features.\n\n"
        "The feature engineering used for training and testing "
        "must be identical."
    )


# ============================================================
# RUN ISOLATION FOREST
# ============================================================

print("Running Isolation Forest...")

anomaly_score_raw = -pipeline.decision_function(features_df)[0]

prediction = pipeline.predict(features_df)[0]


# ============================================================
# CONVERT SCORE TO DISPLAY SCORE
# ============================================================

# This is a DISPLAY score, not a probability.
# Higher value = more anomalous.

score = max(0, min(100, anomaly_score_raw * 100))


# ============================================================
# DETERMINE STATUS
# ============================================================

if prediction == 1:

    status = "NORMAL"

else:

    # The Isolation Forest itself says anomaly.
    # We display it as HIGH ANOMALY.

    status = "HIGH ANOMALY"


# ============================================================
# DISPLAY RESULT
# ============================================================

print("\n" + "=" * 70)
print("                 ANALYSIS RESULT")
print("=" * 70)

print(f"\nComponent ID   : {component_id}")
print(f"Lot ID         : {lot_id}")

print("\nEarly burn-in measurements used:")
print("0h → 24h → 48h → 96h")

print("\n168h measurement:")
print("NOT USED")

print("\nIsolation Forest result:")
print(f"Anomaly Score  : {score:.2f}")
print(f"Status         : {status}")

print("\n" + "=" * 70)

if status == "NORMAL":

    print("The component does not show significant")
    print("early-burn-in anomalous behavior.")

else:

    print("The component shows anomalous early-burn-in behavior.")
    print("Further investigation is recommended.")

print("=" * 70)

