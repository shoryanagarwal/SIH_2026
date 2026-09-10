from pathlib import Path

import numpy as np
import pandas as pd


# ============================================================
# TRACEX-AI - DATASET SPLITTING
# ============================================================

print("=" * 65)
print("             TRACEX-AI")
print("          DATASET SPLITTING")
print("=" * 65)


# ============================================================
# 1. PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = PROJECT_ROOT / "data" / "component_burnin_final.csv"

PROCESSED_DIR = PROJECT_ROOT / "processed_data"
PROCESSED_DIR.mkdir(exist_ok=True)

TRAIN_PATH = PROCESSED_DIR / "train.csv"
VALIDATION_PATH = PROCESSED_DIR / "validation.csv"
TEST_PATH = PROCESSED_DIR / "test.csv"


# ============================================================
# 2. SETTINGS
# ============================================================

RANDOM_SEED = 42

TRAIN_RATIO = 0.70
VALIDATION_RATIO = 0.15
TEST_RATIO = 0.15


# ============================================================
# 3. CHECK RATIOS
# ============================================================

if not np.isclose(
    TRAIN_RATIO + VALIDATION_RATIO + TEST_RATIO,
    1.0
):
    raise ValueError(
        "Train, validation and test ratios must sum to 1."
    )


# ============================================================
# 4. CHECK INPUT DATASET
# ============================================================

print("\nChecking input dataset...")

if not DATA_PATH.exists():
    raise FileNotFoundError(
        f"Dataset not found:\n{DATA_PATH}"
    )

print(f"Dataset found:\n{DATA_PATH}")


# ============================================================
# 5. LOAD DATASET
# ============================================================

print("\nLoading dataset...")

df = pd.read_csv(DATA_PATH)

print(
    f"Dataset shape: "
    f"{df.shape[0]} rows × {df.shape[1]} columns"
)


# ============================================================
# 6. CHECK REQUIRED COLUMNS
# ============================================================

required_columns = [
    "Component_ID",
    "Lot_ID",
    "True_Class"
]

for column in required_columns:

    if column not in df.columns:
        raise ValueError(
            f"Required column '{column}' "
            f"not found in dataset."
        )

print("Required identifier columns are present.")


# ============================================================
# 7. CHECK COMPONENT IDs
# ============================================================

print("\nChecking Component_ID...")

if df["Component_ID"].isnull().any():
    raise ValueError(
        "Component_ID contains missing values."
    )

if df["Component_ID"].duplicated().any():
    raise ValueError(
        "Duplicate Component_ID values found."
    )

print("Component_ID values are valid and unique.")


# ============================================================
# 8. CHECK LOT IDs
# ============================================================

print("\nChecking Lot_ID...")

if df["Lot_ID"].isnull().any():
    raise ValueError(
        "Lot_ID contains missing values."
    )

number_of_lots = df["Lot_ID"].nunique()

if number_of_lots < 3:
    raise ValueError(
        "At least 3 unique lots are required "
        "for train/validation/test splitting."
    )

print(f"Unique lots: {number_of_lots}")


# ============================================================
# 9. GET UNIQUE LOTS
# ============================================================

print("\nPreparing lot-wise split...")

unique_lots = df["Lot_ID"].drop_duplicates().to_numpy()

rng = np.random.default_rng(RANDOM_SEED)

rng.shuffle(unique_lots)


# ============================================================
# 10. CALCULATE LOT COUNTS
# ============================================================

total_lots = len(unique_lots)

train_lots_count = int(
    total_lots * TRAIN_RATIO
)

validation_lots_count = int(
    total_lots * VALIDATION_RATIO
)

# Remaining lots go to test
test_lots_count = (
    total_lots
    - train_lots_count
    - validation_lots_count
)


# ============================================================
# 11. SAFETY CHECK
# ============================================================

if train_lots_count < 1:
    raise ValueError(
        "Training split contains no lots."
    )

if validation_lots_count < 1:
    raise ValueError(
        "Validation split contains no lots."
    )

if test_lots_count < 1:
    raise ValueError(
        "Test split contains no lots."
    )


# ============================================================
# 12. ASSIGN LOTS
# ============================================================

train_lots = unique_lots[
    :train_lots_count
]

validation_lots = unique_lots[
    train_lots_count:
    train_lots_count + validation_lots_count
]

test_lots = unique_lots[
    train_lots_count + validation_lots_count:
]


# ============================================================
# 13. CREATE DATA SPLITS
# ============================================================

train_df = df[
    df["Lot_ID"].isin(train_lots)
].copy()

validation_df = df[
    df["Lot_ID"].isin(validation_lots)
].copy()

test_df = df[
    df["Lot_ID"].isin(test_lots)
].copy()


# ============================================================
# 14. SHUFFLE ROWS WITHIN EACH SPLIT
# ============================================================

train_df = train_df.sample(
    frac=1,
    random_state=RANDOM_SEED
).reset_index(drop=True)

validation_df = validation_df.sample(
    frac=1,
    random_state=RANDOM_SEED
).reset_index(drop=True)

test_df = test_df.sample(
    frac=1,
    random_state=RANDOM_SEED
).reset_index(drop=True)


# ============================================================
# 15. CHECK ROW COUNTS
# ============================================================

print("\n" + "-" * 65)
print("SPLIT INFORMATION")
print("-" * 65)

print(
    f"Total rows      : {len(df)}"
)

print(
    f"Training rows   : {len(train_df)}"
)

print(
    f"Validation rows : {len(validation_df)}"
)

print(
    f"Test rows       : {len(test_df)}"
)

print(
    f"\nTotal after split: "
    f"{len(train_df) + len(validation_df) + len(test_df)}"
)


# ============================================================
# 16. CHECK ROW CONSERVATION
# ============================================================

if (
    len(train_df)
    + len(validation_df)
    + len(test_df)
    != len(df)
):
    raise ValueError(
        "Row count mismatch after splitting."
    )

print("\nAll rows accounted for.")


# ============================================================
# 17. CHECK LOT OVERLAP
# ============================================================

print("\nChecking lot separation...")

train_lot_set = set(train_df["Lot_ID"])
validation_lot_set = set(validation_df["Lot_ID"])
test_lot_set = set(test_df["Lot_ID"])


if not train_lot_set.isdisjoint(
    validation_lot_set
):
    raise ValueError(
        "Training and validation lots overlap."
    )


if not train_lot_set.isdisjoint(
    test_lot_set
):
    raise ValueError(
        "Training and test lots overlap."
    )


if not validation_lot_set.isdisjoint(
    test_lot_set
):
    raise ValueError(
        "Validation and test lots overlap."
    )


print("No lot overlap found.")


# ============================================================
# 18. CHECK COMPONENT OVERLAP
# ============================================================

print("\nChecking component separation...")

train_components = set(
    train_df["Component_ID"]
)

validation_components = set(
    validation_df["Component_ID"]
)

test_components = set(
    test_df["Component_ID"]
)


if not train_components.isdisjoint(
    validation_components
):
    raise ValueError(
        "Training and validation components overlap."
    )


if not train_components.isdisjoint(
    test_components
):
    raise ValueError(
        "Training and test components overlap."
    )


if not validation_components.isdisjoint(
    test_components
):
    raise ValueError(
        "Validation and test components overlap."
    )


print("No component overlap found.")


# ============================================================
# 19. DISPLAY LOT DISTRIBUTION
# ============================================================

print("\n" + "-" * 65)
print("LOT DISTRIBUTION")
print("-" * 65)

print(
    f"Training lots   : {len(train_lot_set)}"
)

print(
    f"Validation lots : {len(validation_lot_set)}"
)

print(
    f"Test lots       : {len(test_lot_set)}"
)

print("\nTraining lots:")
print(sorted(train_lot_set))

print("\nValidation lots:")
print(sorted(validation_lot_set))

print("\nTest lots:")
print(sorted(test_lot_set))


# ============================================================
# 20. SAVE SPLITS
# ============================================================

print("\nSaving processed datasets...")

train_df.to_csv(
    TRAIN_PATH,
    index=False
)

validation_df.to_csv(
    VALIDATION_PATH,
    index=False
)

test_df.to_csv(
    TEST_PATH,
    index=False
)


# ============================================================
# 21. VERIFY SAVED FILES
# ============================================================

print("\nChecking saved files...")

for file_path in [
    TRAIN_PATH,
    VALIDATION_PATH,
    TEST_PATH
]:

    if not file_path.exists():
        raise FileNotFoundError(
            f"Failed to create:\n{file_path}"
        )

    print(f"OK: {file_path}")


# ============================================================
# 22. FINAL SUMMARY
# ============================================================

print("\n" + "=" * 65)
print("DATASET SPLITTING COMPLETE")
print("=" * 65)

print(
    f"Training   : {len(train_df)} rows | "
    f"{len(train_lot_set)} lots"
)

print(
    f"Validation : {len(validation_df)} rows | "
    f"{len(validation_lot_set)} lots"
)

print(
    f"Test       : {len(test_df)} rows | "
    f"{len(test_lot_set)} lots"
)

print("\nImportant:")
print("- Split is performed by LOT.")
print("- No lot-relative features are created.")
print("- Original raw measurements are preserved.")
print("- 168h remains in these datasets.")
print("- 168h will be excluded later from ML features.")

print("\nFiles created:")
print(TRAIN_PATH)
print(VALIDATION_PATH)
print(TEST_PATH)

print("\nSPLIT DATASET - PASSED")
print("=" * 65)
