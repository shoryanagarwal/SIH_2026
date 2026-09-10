from pathlib import Path

import numpy as np
import pandas as pd


# ============================================================
# TRACEX-AI - PHASE 2
# EARLY BURN-IN FEATURE ENGINEERING
# ============================================================

print("=" * 65)
print("TRACEX-AI - EARLY BURN-IN FEATURE ENGINEERING")
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
# 2. EARLY BURN-IN CONFIGURATION
# ============================================================

# IMPORTANT:
# 168h is intentionally NOT included.
# ML inference will use only measurements available
# before the full burn-in process is completed.

STAGES = ["0h", "24h", "48h", "96h"]

HOURS = [0, 24, 48, 96]

PARAMETERS = [
    "Temperature",
    "VCE",
    "Leakage",
    "Breakdown"
]


# ============================================================
# 3. FEATURE CREATION FUNCTION
# ============================================================

def create_features(data):
    """
    Create engineered features from early burn-in measurements.

    Expected input format:

    data = {
        "Temperature": [0h, 24h, 48h, 96h],
        "VCE":         [0h, 24h, 48h, 96h],
        "Leakage":     [0h, 24h, 48h, 96h],
        "Breakdown":   [0h, 24h, 48h, 96h]
    }

    Returns:
        pandas DataFrame containing 48 engineered features.
    """

    features = {}

    for parameter in PARAMETERS:

        # ----------------------------------------------------
        # Convert values to NumPy array
        # ----------------------------------------------------

        values = np.asarray(
            data[parameter],
            dtype=float
        )

        # ----------------------------------------------------
        # Validate number of measurements
        # ----------------------------------------------------

        if len(values) != 4:
            raise ValueError(
                f"{parameter} must contain exactly 4 values "
                f"for 0h, 24h, 48h and 96h."
            )

        # ----------------------------------------------------
        # Validate numerical values
        # ----------------------------------------------------

        if not np.isfinite(values).all():
            raise ValueError(
                f"{parameter} contains invalid or non-finite values."
            )

        # ----------------------------------------------------
        # 1. Initial value
        # ----------------------------------------------------

        features[f"{parameter}_initial"] = values[0]

        # ----------------------------------------------------
        # 2. Final value
        # ----------------------------------------------------

        features[f"{parameter}_final"] = values[-1]

        # ----------------------------------------------------
        # 3. Absolute change
        # ----------------------------------------------------

        features[f"{parameter}_change"] = (
            values[-1] - values[0]
        )

        # ----------------------------------------------------
        # 4. Percentage change
        # ----------------------------------------------------

        if values[0] != 0:

            features[f"{parameter}_pct_change"] = (
                (values[-1] - values[0])
                / values[0]
            ) * 100

        else:

            features[f"{parameter}_pct_change"] = 0.0

        # ----------------------------------------------------
        # 5. Minimum
        # ----------------------------------------------------

        features[f"{parameter}_min"] = np.min(values)

        # ----------------------------------------------------
        # 6. Maximum
        # ----------------------------------------------------

        features[f"{parameter}_max"] = np.max(values)

        # ----------------------------------------------------
        # 7. Mean
        # ----------------------------------------------------

        features[f"{parameter}_mean"] = np.mean(values)

        # ----------------------------------------------------
        # 8. Standard deviation
        # ----------------------------------------------------

        features[f"{parameter}_std"] = np.std(values)

        # ----------------------------------------------------
        # 9-11. Stage-to-stage changes
        # ----------------------------------------------------

        for i in range(len(values) - 1):

            features[
                f"{parameter}_delta_{STAGES[i]}_to_{STAGES[i + 1]}"
            ] = (
                values[i + 1] - values[i]
            )

        # ----------------------------------------------------
        # 12. Overall slope
        # ----------------------------------------------------

        features[f"{parameter}_slope"] = np.polyfit(
            HOURS,
            values,
            1
        )[0]

    # --------------------------------------------------------
    # Convert dictionary to DataFrame
    # --------------------------------------------------------

    feature_df = pd.DataFrame([features])

    # --------------------------------------------------------
    # Final safety check
    # --------------------------------------------------------

    if feature_df.shape[1] != 48:
        raise ValueError(
            f"Expected 48 engineered features, "
            f"but generated {feature_df.shape[1]}."
        )

    return feature_df


# ============================================================
# 4. FEATURE COLUMN GENERATOR
# ============================================================

def get_expected_feature_columns():
    """
    Generate the exact feature names expected by
    the early-burn-in Isolation Forest model.
    """

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


# ============================================================
# 5. TEST FEATURE ENGINEERING
# ============================================================

if __name__ == "__main__":

    print("\nTesting early burn-in feature engineering...")

    # --------------------------------------------------------
    # Example measurements
    # --------------------------------------------------------

    test_data = {

        "Temperature": [
            125.0,
            125.2,
            125.1,
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
            79.7,
            79.5
        ]
    }

    # --------------------------------------------------------
    # Create features
    # --------------------------------------------------------

    X = create_features(test_data)

    # --------------------------------------------------------
    # Expected columns
    # --------------------------------------------------------

    expected_columns = get_expected_feature_columns()

    # --------------------------------------------------------
    # Verify feature count
    # --------------------------------------------------------

    assert X.shape[1] == 48, (
        f"Expected 48 features, got {X.shape[1]}"
    )

    # --------------------------------------------------------
    # Verify exact column names and order
    # --------------------------------------------------------

    assert list(X.columns) == expected_columns, (
        "Generated feature columns do not match "
        "the expected early-burn-in feature structure."
    )

    # --------------------------------------------------------
    # Verify no 168h feature exists
    # --------------------------------------------------------

    forbidden_features = [
        column
        for column in X.columns
        if "168h" in column
    ]

    assert len(forbidden_features) == 0, (
        f"168h features found: {forbidden_features}"
    )

    # --------------------------------------------------------
    # Verify all features are finite
    # --------------------------------------------------------

    assert np.isfinite(
        X.to_numpy()
    ).all(), (
        "Non-finite values found in engineered features."
    )

    # --------------------------------------------------------
    # Display results
    # --------------------------------------------------------

    print("\nFeature engineering test PASSED.")

    print(f"\nNumber of parameters : {len(PARAMETERS)}")
    print(f"Number of stages     : {len(STAGES)}")
    print(f"Number of features   : {X.shape[1]}")

    print("\nStages used:")
    print(" → ".join(STAGES))

    print("\nFeature columns:")

    for index, column in enumerate(X.columns, start=1):
        print(f"{index:02d}. {column}")

    print("\n" + "=" * 65)
    print("PHASE 2 FEATURE ENGINEERING COMPLETE")
    print("=" * 65)

