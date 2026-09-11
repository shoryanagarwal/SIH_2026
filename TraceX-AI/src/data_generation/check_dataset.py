from pathlib import Path

import numpy as np
import pandas as pd


# ============================================================
# TRACEX-AI - DATASET VALIDATION
# ============================================================

print("=" * 65)
print("             TRACEX-AI")
print("          DATASET VALIDATION")
print("=" * 65)


# ============================================================
# 1. PROJECT PATH
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = PROJECT_ROOT / "data" / "component_burnin_final.csv"


# ============================================================
# 2. CHECK DATASET EXISTS
# ============================================================

print("\nChecking dataset...")

if not DATA_PATH.exists():
    raise FileNotFoundError(
        f"Dataset not found:\n{DATA_PATH}"
    )

print(f"Dataset found:\n{DATA_PATH}")


# ============================================================
# 3. LOAD DATASET
# ============================================================

print("\nLoading dataset...")

df = pd.read_csv(DATA_PATH)

print("Dataset loaded successfully.")


# ============================================================
# 4. BASIC DATASET INFORMATION
# ============================================================

print("\n" + "-" * 65)
print("BASIC DATASET INFORMATION")
print("-" * 65)

print(f"Rows    : {df.shape[0]}")
print(f"Columns : {df.shape[1]}")


# ============================================================
# 5. REQUIRED COLUMNS
# ============================================================

required_columns = [
    "Component_ID",
    "Lot_ID",
    "True_Class",

    "Temperature_C_0h",
    "Temperature_C_24h",
    "Temperature_C_48h",
    "Temperature_C_96h",
    "Temperature_C_168h",

    "VCE_0h",
    "VCE_24h",
    "VCE_48h",
    "VCE_96h",
    "VCE_168h",

    "Leakage_uA_0h",
    "Leakage_uA_24h",
    "Leakage_uA_48h",
    "Leakage_uA_96h",
    "Leakage_uA_168h",

    "Breakdown_V_0h",
    "Breakdown_V_24h",
    "Breakdown_V_48h",
    "Breakdown_V_96h",
    "Breakdown_V_168h"
]

print("\nChecking required columns...")

missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        f"Missing required columns:\n{missing_columns}"
    )

print("All required columns are present.")


# ============================================================
# 6. CHECK IDENTIFIER COLUMNS
# ============================================================

print("\nChecking identifiers...")

if df["Component_ID"].isnull().any():
    raise ValueError("Component_ID contains missing values.")

if df["Lot_ID"].isnull().any():
    raise ValueError("Lot_ID contains missing values.")

if df["Component_ID"].duplicated().any():
    raise ValueError(
        "Duplicate Component_ID values found."
    )

print("Component_ID values are valid and unique.")
print("Lot_ID values are present.")


# ============================================================
# 7. CHECK TRUE CLASS VALUES
# ============================================================

print("\nChecking True_Class values...")

allowed_classes = {
    "NORMAL",
    "LATENT_DEFECT",
    "OBVIOUS_FAILURE"
}

actual_classes = set(
    df["True_Class"].dropna().unique()
)

invalid_classes = actual_classes - allowed_classes

if invalid_classes:
    raise ValueError(
        f"Unexpected True_Class values found:\n"
        f"{invalid_classes}"
    )

print("True_Class values are valid.")

print("\nClass distribution:")
print(df["True_Class"].value_counts())


# ============================================================
# 8. CHECK NUMERIC MEASUREMENTS
# ============================================================

measurement_columns = [
    column
    for column in required_columns
    if column not in [
        "Component_ID",
        "Lot_ID",
        "True_Class"
    ]
]

print("\nChecking measurement columns...")

for column in measurement_columns:

    if not pd.api.types.is_numeric_dtype(df[column]):
        raise ValueError(
            f"Column '{column}' is not numeric."
        )

    if df[column].isnull().any():
        raise ValueError(
            f"Column '{column}' contains missing values."
        )

    if not np.isfinite(
        df[column].to_numpy()
    ).all():
        raise ValueError(
            f"Column '{column}' contains "
            f"infinite or invalid values."
        )

print("All measurement columns are numeric and finite.")


# ============================================================
# 9. CHECK BURN-IN TIMEPOINTS
# ============================================================

print("\nChecking burn-in timepoints...")

expected_timepoints = [
    "0h",
    "24h",
    "48h",
    "96h",
    "168h"
]

parameters = [
    "Temperature",
    "VCE",
    "Leakage",
    "Breakdown"
]

for parameter in parameters:

    for timepoint in expected_timepoints:

        matching_columns = [
            column
            for column in df.columns
            if parameter in column
            and timepoint in column
        ]

        if not matching_columns:
            raise ValueError(
                f"Missing {parameter} measurement "
                f"at {timepoint}."
            )

print(
    "All parameters contain measurements "
    "at 0h, 24h, 48h, 96h and 168h."
)


# ============================================================
# 10. CHECK LOT INFORMATION
# ============================================================

print("\nChecking lot information...")

number_of_lots = df["Lot_ID"].nunique()

print(f"Unique lots       : {number_of_lots}")
print(
    f"Components per lot:\n"
    f"{df.groupby('Lot_ID').size().describe()}"
)


# ============================================================
# 11. CHECK DATASET SIZE
# ============================================================

print("\nChecking dataset size...")

if len(df) < 100:
    raise ValueError(
        "Dataset contains too few rows."
    )

print(
    f"Dataset contains {len(df)} components."
)



print("\n" + "-" * 65)
print("DATASET SAMPLE")
print("-" * 65)

print(df.head())




print("\n" + "=" * 65)
print("DATASET VALIDATION SUMMARY")
print("=" * 65)

print(f"Total components : {len(df)}")
print(f"Total lots       : {df['Lot_ID'].nunique()}")
print(f"Total columns    : {len(df.columns)}")

print("\nBurn-in stages available:")
print("0h → 24h → 48h → 96h → 168h")

print("\nImportant:")
print("168h is retained in the raw dataset.")
print("It will NOT be used by the early Isolation Forest.")
print("168h remains available for DL/evaluation.")

print("\nDATASET VALIDATION PASSED")
print("=" * 65)

