from pathlib import Path

import pandas as pd
import matplotlib.pyplot as plt


# ============================================================
# TRACEX-AI - DATASET VISUALIZATION
# ============================================================

print("=" * 65)
print("             TRACEX-AI")
print("         DATASET VISUALIZATION")
print("=" * 65)


# ============================================================
# 1. PROJECT PATH
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = PROJECT_ROOT / "data" / "component_burnin_final.csv"

RESULTS_DIR = PROJECT_ROOT / "results"
RESULTS_DIR.mkdir(exist_ok=True)


# ============================================================
# 2. LOAD DATASET
# ============================================================

print("\nLoading dataset...")

if not DATA_PATH.exists():
    raise FileNotFoundError(
        f"Dataset not found:\n{DATA_PATH}"
    )

df = pd.read_csv(DATA_PATH)

print(f"Dataset loaded: {df.shape[0]} rows × {df.shape[1]} columns")


# ============================================================
# 3. DATASET OVERVIEW
# ============================================================

print("\n" + "-" * 65)
print("DATASET OVERVIEW")
print("-" * 65)

print(df.head())

print("\nDataset shape:")
print(df.shape)

print("\nData types:")
print(df.dtypes)


# ============================================================
# 4. CLASS DISTRIBUTION
# ============================================================

print("\n" + "-" * 65)
print("TRUE CLASS DISTRIBUTION")
print("-" * 65)

class_counts = df["True_Class"].value_counts()

print(class_counts)


# ============================================================
# 5. CLASS DISTRIBUTION PLOT
# ============================================================

plt.figure(figsize=(8, 5))

class_counts.plot(
    kind="bar"
)

plt.title("Component Class Distribution")
plt.xlabel("True Class")
plt.ylabel("Number of Components")
plt.xticks(rotation=0)

plt.tight_layout()

class_plot_path = (
    RESULTS_DIR / "class_distribution.png"
)

plt.savefig(class_plot_path, dpi=300)

plt.show()

print(
    f"\nSaved: {class_plot_path}"
)


# ============================================================
# 6. TEMPERATURE TREND
# ============================================================

temperature_columns = [
    "Temperature_C_0h",
    "Temperature_C_24h",
    "Temperature_C_48h",
    "Temperature_C_96h",
    "Temperature_C_168h"
]

temperature_means = df[
    temperature_columns
].mean()

plt.figure(figsize=(9, 5))

plt.plot(
    ["0h", "24h", "48h", "96h", "168h"],
    temperature_means.values,
    marker="o"
)

plt.title("Average Temperature During Burn-in")
plt.xlabel("Burn-in Time")
plt.ylabel("Temperature (°C)")
plt.grid(True)

plt.tight_layout()

temperature_plot_path = (
    RESULTS_DIR / "temperature_trend.png"
)

plt.savefig(
    temperature_plot_path,
    dpi=300
)

plt.show()

print(
    f"Saved: {temperature_plot_path}"
)


# ============================================================
# 7. VCE TREND
# ============================================================

vce_columns = [
    "VCE_0h",
    "VCE_24h",
    "VCE_48h",
    "VCE_96h",
    "VCE_168h"
]

vce_means = df[vce_columns].mean()

plt.figure(figsize=(9, 5))

plt.plot(
    ["0h", "24h", "48h", "96h", "168h"],
    vce_means.values,
    marker="o"
)

plt.title("Average VCE During Burn-in")
plt.xlabel("Burn-in Time")
plt.ylabel("VCE (V)")
plt.grid(True)

plt.tight_layout()

vce_plot_path = (
    RESULTS_DIR / "vce_trend.png"
)

plt.savefig(
    vce_plot_path,
    dpi=300
)

plt.show()

print(
    f"Saved: {vce_plot_path}"
)


# ============================================================
# 8. LEAKAGE TREND
# ============================================================

leakage_columns = [
    "Leakage_uA_0h",
    "Leakage_uA_24h",
    "Leakage_uA_48h",
    "Leakage_uA_96h",
    "Leakage_uA_168h"
]

leakage_means = df[
    leakage_columns
].mean()

plt.figure(figsize=(9, 5))

plt.plot(
    ["0h", "24h", "48h", "96h", "168h"],
    leakage_means.values,
    marker="o"
)

plt.title("Average Leakage Current During Burn-in")
plt.xlabel("Burn-in Time")
plt.ylabel("Leakage Current (µA)")
plt.grid(True)

plt.tight_layout()

leakage_plot_path = (
    RESULTS_DIR / "leakage_trend.png"
)

plt.savefig(
    leakage_plot_path,
    dpi=300
)

plt.show()

print(
    f"Saved: {leakage_plot_path}"
)


# ============================================================
# 9. BREAKDOWN VOLTAGE TREND
# ============================================================

breakdown_columns = [
    "Breakdown_V_0h",
    "Breakdown_V_24h",
    "Breakdown_V_48h",
    "Breakdown_V_96h",
    "Breakdown_V_168h"
]

breakdown_means = df[
    breakdown_columns
].mean()

plt.figure(figsize=(9, 5))

plt.plot(
    ["0h", "24h", "48h", "96h", "168h"],
    breakdown_means.values,
    marker="o"
)

plt.title("Average Breakdown Voltage During Burn-in")
plt.xlabel("Burn-in Time")
plt.ylabel("Breakdown Voltage (V)")
plt.grid(True)

plt.tight_layout()

breakdown_plot_path = (
    RESULTS_DIR / "breakdown_voltage_trend.png"
)

plt.savefig(
    breakdown_plot_path,
    dpi=300
)

plt.show()

print(
    f"Saved: {breakdown_plot_path}"
)


# ============================================================
# 10. PARAMETER DISTRIBUTIONS AT 0h
# ============================================================

initial_columns = [
    "Temperature_C_0h",
    "VCE_0h",
    "Leakage_uA_0h",
    "Breakdown_V_0h"
]

print("\n" + "-" * 65)
print("INITIAL MEASUREMENT STATISTICS")
print("-" * 65)

print(
    df[initial_columns].describe()
)


# ============================================================
# 11. FINAL MEASUREMENTS AT 168h
# ============================================================

final_columns = [
    "Temperature_C_168h",
    "VCE_168h",
    "Leakage_uA_168h",
    "Breakdown_V_168h"
]

print("\n" + "-" * 65)
print("168h MEASUREMENT STATISTICS")
print("-" * 65)

print(
    df[final_columns].describe()
)


# ============================================================
# 12. LOT DISTRIBUTION
# ============================================================

lot_counts = df["Lot_ID"].value_counts()

print("\n" + "-" * 65)
print("LOT INFORMATION")
print("-" * 65)

print(f"Number of lots: {df['Lot_ID'].nunique()}")

print("\nComponents per lot:")
print(lot_counts.describe())


# ============================================================
# 13. FINAL SUMMARY
# ============================================================

print("\n" + "=" * 65)
print("VISUALIZATION COMPLETE")
print("=" * 65)

print("\nGenerated visualizations:")
print("1. Class distribution")
print("2. Temperature trend")
print("3. VCE trend")
print("4. Leakage trend")
print("5. Breakdown voltage trend")

print("\nImportant:")
print("168h is visualized because it is part of the raw dataset.")
print("168h will NOT be used for early Isolation Forest inference.")

print("\nEDA COMPLETED SUCCESSFULLY")
print("=" * 65)

