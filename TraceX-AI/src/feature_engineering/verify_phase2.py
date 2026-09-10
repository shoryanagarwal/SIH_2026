from pathlib import Path

import numpy as np
import pandas as pd


# ============================================================
# TRACEX-AI - PHASE 2 VERIFICATION
# ============================================================

print("=" * 65)
print("TRACEX-AI - PHASE 2 VERIFICATION")
print("=" * 65)


# ============================================================
# 1. PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

PROCESSED_DIR = PROJECT_ROOT / "processed_data"

TRAIN_PATH = PROCESSED_DIR / "train.csv"
VALIDATION_PATH = PROCESSED_DIR / "validation.csv"
TEST_PATH = PROCESSED_DIR / "test.csv"


# ============================================================
# 2. REQUIRED EARLY-BURN-IN RAW COLUMNS
# ============================================================

REQUIRED_EARLY_COLUMNS = [

    # Temperature
    "Temperature_C_0h",
    "Temperature_C_24h",
    "Temperature_C_48h",
    "Temperature_C_96h",

    # VCE
    "VCE_0h",
    "VCE_24h",
    "VCE_48h",
    "VCE_96h",

    # Leakage
    "Leakage_uA_0h",
    "Leakage_uA_24h",
    "Leakage_uA_48h",
    "Leakage_uA_96h",

    # Breakdown Voltage
    "Breakdown_V_0h",
    "Breakdown_V_24h",
    "Breakdown_V_48h",
    "Breakdown_V_96h"
]


# ============================================================
# 3. FORBIDDEN ML TIME POINT
# ============================================================

FORBIDDEN_TIME_POINT = "168h"


# ============================================================
# 4. EXPECTED FEATURE COLUMNS
# ============================================================

PARAMETERS = [
    "Temperature",
    "VCE",
    "Leakage",
    "Breakdown"
]


def get_expected_feature_columns():

    columns = []

    for parameter in PARAMETERS:

        columns.extend([

            f"{parameter}_initial",

            f"{parameter}_final",

            f"{parameter}_change",

            f"{parameter}_pct_change",

            f"{parameter}_min",

            f"{parameter}_max",

            f"{parameter}_mean",

            f"{parameter}_std",

            f"{parameter}_delta_0h_to_24h",

            f"{parameter}_delta_24h_to_48h",

            f"{parameter}_delta_48h_to_96h",

            f"{parameter}_slope"
        ])

    return columns


EXPECTED_FEATURE_COLUMNS = get_expected_feature_columns()


# ============================================================
# 5. CHECK REQUIRED FILES
# ============================================================

print("\nChecking processed datasets...")

required_files = [
    TRAIN_PATH,
    VALIDATION_PATH,
    TEST_PATH
]

for file_path in required_files:

    assert file_path.exists(), (
        f"Missing required file: {file_path}"
    )

    print(f"OK: {file_path}")


# ============================================================
# 6. LOAD DATASETS
# ============================================================

print("\nLoading datasets...")

train_df = pd.read_csv(TRAIN_PATH)
validation_df = pd.read_csv(VALIDATION_PATH)
test_df = pd.read_csv(TEST_PATH)

print(f"Training rows   : {len(train_df)}")
print(f"Validation rows : {len(validation_df)}")
print(f"Test rows       : {len(test_df)}")


# ============================================================
# 7. CHECK RAW EARLY-BURN-IN COLUMNS
# ============================================================

print("\nChecking early burn-in measurement columns...")

for name, dataframe in [

    ("Training", train_df),
    ("Validation", validation_df),
    ("Test", test_df)

]:

    for column in REQUIRED_EARLY_COLUMNS:

        assert column in dataframe.columns, (
            f"{column} missing from {name} dataset."
        )

print("All required 0h/24h/48h/96h columns are present.")


# ============================================================
# 8. CHECK 168h REMAINS IN SOURCE DATA
# ============================================================

print("\nChecking 168h source measurements...")

columns_168h = [
    column
    for column in train_df.columns
    if "168h" in column
]

assert len(columns_168h) > 0, (
    "168h measurements are missing from source dataset."
)

print(
    f"168h source columns found: {len(columns_168h)}"
)

for column in columns_168h:
    print(f"  {column}")

print(
    "\n168h remains available in the raw dataset "
    "for DL/evaluation."
)


# ============================================================
# 9. CHECK EXPECTED FEATURE STRUCTURE
# ============================================================

print("\nChecking expected feature structure...")

print(
    f"Expected engineered features: "
    f"{len(EXPECTED_FEATURE_COLUMNS)}"
)

assert len(EXPECTED_FEATURE_COLUMNS) == 48, (
    "Expected exactly 48 engineered features."
)

print("Expected feature count = 48.")


# ============================================================
# 10. CHECK FEATURE NAMES
# ============================================================

print("\nChecking feature names...")

for column in EXPECTED_FEATURE_COLUMNS:

    assert "168h" not in column, (
        f"Forbidden 168h feature found: {column}"
    )

print(
    "No expected feature contains 168h."
)


# ============================================================
# 11. DISPLAY FEATURE GROUPS
# ============================================================

print("\nFeature groups:")

for parameter in PARAMETERS:

    parameter_features = [
        column
        for column in EXPECTED_FEATURE_COLUMNS
        if column.startswith(parameter + "_")
    ]

    print(
        f"\n{parameter}: "
        f"{len(parameter_features)} features"
    )

    for column in parameter_features:
        print(f"  - {column}")


# ============================================================
# 12. TEST FEATURE ENGINEERING FUNCTION
# ============================================================

print("\nTesting create_features() function...")

# Import from create_features.py
from create_features import (
    create_features,
    get_expected_feature_columns
)


# ------------------------------------------------------------
# Example early-burn-in input
# ------------------------------------------------------------

test_data = {

    "Temperature": [
        125.0,
        125.1,
        125.2,
        125.3
    ],

    "VCE": [
        5.00,
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
        79.6,
        79.4
    ]
}


# ------------------------------------------------------------
# Generate features
# ------------------------------------------------------------

X = create_features(test_data)


# ============================================================
# 13. CHECK GENERATED FEATURE COUNT
# ============================================================

print("\nChecking generated feature count...")

assert X.shape[0] == 1, (
    "Expected one feature row."
)

assert X.shape[1] == 48, (
    f"Expected 48 features, got {X.shape[1]}."
)

print("Generated feature count = 48.")


# ============================================================
# 14. CHECK EXACT FEATURE ORDER
# ============================================================

print("\nChecking feature names and order...")

actual_columns = list(X.columns)

expected_columns = get_expected_feature_columns()

assert actual_columns == expected_columns, (
    "Generated feature columns do not exactly "
    "match expected feature columns."
)

print("Feature names and order are correct.")


# ============================================================
# 15. CHECK NO 168h FEATURE
# ============================================================

print("\nChecking for forbidden 168h features...")

forbidden_features = [
    column
    for column in X.columns
    if FORBIDDEN_TIME_POINT in column
]

assert len(forbidden_features) == 0, (
    f"168h features detected: {forbidden_features}"
)

print("No 168h features generated.")


# ============================================================
# 16. CHECK FINITE VALUES
# ============================================================

print("\nChecking engineered feature values...")

assert np.isfinite(
    X.to_numpy()
).all(), (
    "Non-finite values found in engineered features."
)

print("All engineered feature values are finite.")


# ============================================================
# 17. CHECK 168h IS NOT USED BY FEATURE ENGINEERING
# ============================================================

print("\nChecking early-burn-in isolation...")

# Create another dataset with the same early measurements.
# There is intentionally no 168h value.

early_only_data = {

    "Temperature": [
        125.0,
        125.1,
        125.2,
        125.3
    ],

    "VCE": [
        5.00,
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
        79.6,
        79.4
    ]
}

X_early = create_features(
    early_only_data
)

assert X_early.shape == (1, 48), (
    "Early-burn-in feature matrix is incorrect."
)

print(
    "Feature engineering works using only "
    "0h/24h/48h/96h measurements."
)


# ============================================================
# 18. FINAL SUMMARY
# ============================================================

print("\n" + "=" * 65)
print("PHASE 2 VERIFICATION SUMMARY")
print("=" * 65)

print(f"Training rows          : {len(train_df)}")
print(f"Validation rows        : {len(validation_df)}")
print(f"Test rows              : {len(test_df)}")

print(
    f"Early stages used      : "
    f"{' → '.join(['0h', '24h', '48h', '96h'])}"
)

print(
    f"Parameters             : {len(PARAMETERS)}"
)

print(
    f"Features per parameter : 12"
)

print(
    f"Total ML features      : 48"
)

print(
    f"168h used by ML        : NO"
)

print(
    f"168h kept in dataset   : YES"
)

print("\nAll Phase 2 checks passed.")
print("PHASE 2 COMPLETE")
print("=" * 65)
