import json
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.ml.pipeline import get_pipeline
from backend.ml.idw_validation import IDWCrossValidator

def main():
    pipeline = get_pipeline()
    df = pipeline.processed_df if pipeline.processed_df is not None else pipeline.full_processed_df
    report = IDWCrossValidator.leave_one_station_out_cv(df)

    matrix = report["grid_search_matrix"]
    # Sort by Heat Index MAE ascending to find actual ranks
    sorted_by_hi = sorted(matrix, key=lambda x: (x["heat_index_mae"], x["temperature_mae"]))

    print("=" * 80)
    print("LEAVE-ONE-STATION-OUT CROSS-VALIDATION (LOSOCV) — 30 CONFIGURATIONS")
    print("=" * 80)
    print(f"{'Rank':<5} {'k':<4} {'p':<5} {'Temp MAE':<10} {'Temp RMSE':<10} {'HI MAE':<10} {'HI RMSE':<10} {'R² Score':<10}")
    print("-" * 80)

    for rank, r in enumerate(sorted_by_hi, 1):
        is_sel = " [SELECTED]" if r['k'] == 4 and abs(r['p'] - 2.0) < 1e-4 else ""
        print(f"{rank:<5} {r['k']:<4} {r['p']:<5.1f} {r['temperature_mae']:<10.2f} {r['temperature_rmse']:<10.2f} {r['heat_index_mae']:<10.2f} {r['heat_index_rmse']:<10.2f} {r['heat_index_r2']:<10.3f}{is_sel}")

    print("=" * 80)
    print("Distance Correlation (Pearson r):", report["distance_correlation"])
    print("Selected Configuration:", report["selected_configuration"])
    print("Best Configuration:", report["best_configuration"])

if __name__ == "__main__":
    main()
