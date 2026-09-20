"""
Unsupervised Climate Anomaly Detection Engine (RQ3)
Couples Isolation Forest (path-length tree ensemble) and Local Outlier Factor (LOF density ratio)
with historical biometeorological baseline deviations (ΔT, ΔHI, ΔRH) to discover microclimatic anomalies.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor

class ClimateAnomalyEngine:
    """
    Identifies hidden thermodynamic outliers and microclimatic anomalies
    without ground-truth casualty or disaster labels.
    """

    def __init__(self, random_state: int = 42):
        self.random_state = random_state

    def detect_anomalies(self, df: pd.DataFrame, X_scaled: np.ndarray) -> Dict[str, Any]:
        """
        Runs Isolation Forest and Local Outlier Factor over scaled features.
        Computes station-level baseline deviations and thermodynamic anomaly taxonomy.
        """
        n_samples = X_scaled.shape[0]

        # 1. Isolation Forest (Tree path length isolation)
        iso_forest = IsolationForest(
            n_estimators=150,
            contamination=0.08,
            max_samples="auto",
            random_state=self.random_state
        )
        iso_preds = iso_forest.fit_predict(X_scaled) # -1 for anomaly, 1 for inlier
        iso_raw_scores = iso_forest.decision_function(X_scaled) # Lower = more anomalous

        # Normalize IF score to [0, 1] where 1.0 = extreme anomaly
        iso_min, iso_max = iso_raw_scores.min(), iso_raw_scores.max()
        iso_range = max(1e-5, iso_max - iso_min)
        iso_norm = 1.0 - ((iso_raw_scores - iso_min) / iso_range)

        # 2. Local Outlier Factor (LOF density ratio)
        lof = LocalOutlierFactor(n_neighbors=min(15, max(3, n_samples - 1)), contamination=0.08)
        lof_preds = lof.fit_predict(X_scaled) # -1 for anomaly, 1 for inlier
        lof_raw_scores = -lof.negative_outlier_factor_ # ~1.0 for inliers, >1.5 for strong outliers

        # Normalize LOF to [0, 1]
        lof_min, lof_max = lof_raw_scores.min(), lof_raw_scores.max()
        lof_range = max(1e-5, lof_max - lof_min)
        lof_norm = (lof_raw_scores - lof_min) / lof_range

        # 3. Ensemble Composite Anomaly Score: A = 0.5 * IF + 0.5 * LOF
        composite_anomaly = 0.5 * iso_norm + 0.5 * lof_norm

        # 4. Regional & Historical Baseline Deviations
        mean_nat_temp = float(df["mean_temp_c"].mean()) if "mean_temp_c" in df.columns else 32.0
        mean_nat_hi = float(df["heat_index_c"].mean()) if "heat_index_c" in df.columns else 38.0
        mean_nat_rh = float(df["relative_humidity"].mean()) if "relative_humidity" in df.columns else 50.0

        # Create temporary working copy to aggregate by station
        work_df = df.copy()
        work_df["iso_anomaly_score"] = iso_norm
        work_df["lof_anomaly_score"] = lof_norm
        work_df["composite_anomaly"] = composite_anomaly
        work_df["is_outlier"] = (iso_preds == -1) | (lof_preds == -1)

        station_records = []
        unique_stations = work_df["STATION"].unique()

        for st_id in unique_stations:
            st_sub = work_df[work_df["STATION"] == st_id]
            st_name = str(st_sub["NAME"].iloc[0])
            st_lat = float(st_sub["LATITUDE"].iloc[0])
            st_lon = float(st_sub["LONGITUDE"].iloc[0])

            mean_temp = float(st_sub["mean_temp_c"].mean())
            mean_hi = float(st_sub["heat_index_c"].mean())
            mean_rh = float(st_sub["relative_humidity"].mean())
            dtr = float(st_sub["temperature_range"].mean()) if "temperature_range" in st_sub.columns else 10.0

            avg_comp_score = float(st_sub["composite_anomaly"].mean())
            avg_if_score = float(st_sub["iso_anomaly_score"].mean())
            avg_lof_score = float(st_sub["lof_anomaly_score"].mean())
            outlier_rate = float(st_sub["is_outlier"].mean())

            delta_t = round(mean_temp - mean_nat_temp, 2)
            delta_hi = round(mean_hi - mean_nat_hi, 2)
            delta_rh = round(mean_rh - mean_nat_rh, 2)

            # Thermodynamic Anomaly Taxonomy
            if avg_comp_score >= 0.55 and delta_rh >= 8.0 and delta_hi >= 3.0:
                taxonomy = "Severe Compound Trap"
                badge_color = "rose"
                risk_tier = "Extreme Risk"
                phys_explanation = f"Amplified humidity trap (+{delta_rh:.1f}% RH), suppressing evaporative cooling and inflating Heat Index by +{delta_hi:.1f}°C."
            elif avg_comp_score >= 0.55 and delta_t >= 3.5:
                taxonomy = "Thermal Spike Outlier"
                badge_color = "amber"
                risk_tier = "High Risk"
                phys_explanation = f"Hyperthermic temperature surge (+{delta_t:.1f}°C above national baseline), driving extreme dry thermal loading."
            elif avg_comp_score >= 0.50 and dtr >= 14.0 and delta_rh <= -8.0:
                taxonomy = "Dry Arid Blast"
                badge_color = "orange"
                risk_tier = "Moderate Risk"
                phys_explanation = f"Severe continental diurnal oscillation (DTR {dtr:.1f}°C) with desiccating humidity deficit ({delta_rh:.1f}% RH)."
            elif avg_comp_score >= 0.45:
                taxonomy = "Microclimate Divergence"
                badge_color = "purple"
                risk_tier = "Moderate Risk"
                phys_explanation = f"Localized microclimate departure with moderate composite anomaly ({avg_comp_score:.2f})."
            else:
                taxonomy = "Normal Regional Variation"
                badge_color = "emerald"
                risk_tier = "Low Risk"
                phys_explanation = "Observational parameters conform closely to the standard regional climate cluster archetype."

            station_records.append({
                "station_id": str(st_id),
                "name": st_name,
                "latitude": st_lat,
                "longitude": st_lon,
                "mean_temp_c": round(mean_temp, 1),
                "mean_heat_index_c": round(mean_hi, 1),
                "mean_relative_humidity": round(mean_rh, 1),
                "dtr_c": round(dtr, 1),
                "delta_temp_c": delta_t,
                "delta_heat_index_c": delta_hi,
                "delta_relative_humidity": delta_rh,
                "isolation_forest_score": round(avg_if_score, 3),
                "lof_score": round(avg_lof_score, 3),
                "composite_anomaly_score": round(avg_comp_score, 3),
                "outlier_frequency_pct": round(outlier_rate * 100.0, 1),
                "taxonomy": taxonomy,
                "badge_color": badge_color,
                "risk_tier": risk_tier,
                "explanation": phys_explanation
            })

        # Sort by composite anomaly score descending
        station_records.sort(key=lambda x: x["composite_anomaly_score"], reverse=True)

        # 2D Scatter Data (IF score vs LOF score for all stations)
        scatter_points = [
            {
                "station_id": s["station_id"],
                "name": s["name"],
                "x_iso": s["isolation_forest_score"],
                "y_lof": s["lof_score"],
                "composite_score": s["composite_anomaly_score"],
                "taxonomy": s["taxonomy"],
                "color": s["badge_color"]
            }
            for s in station_records
        ]

        # Anomaly Distribution Histogram (10 bins from 0.0 to 1.0)
        hist, bin_edges = np.histogram(composite_anomaly, bins=10, range=(0.0, 1.0))
        distribution = [
            {
                "bin_range": f"{bin_edges[i]:.1f}-{bin_edges[i+1]:.1f}",
                "count": int(hist[i]),
                "pct": round(float(hist[i] / n_samples) * 100.0, 1)
            }
            for i in range(len(hist))
        ]

        # Taxonomy Summary Counts
        taxonomy_counts: Dict[str, int] = {}
        for s in station_records:
            tax = s["taxonomy"]
            taxonomy_counts[tax] = taxonomy_counts.get(tax, 0) + 1

        taxonomy_summary = [
            {"taxonomy": k, "count": v, "pct": round((v / len(station_records)) * 100.0, 1)}
            for k, v in taxonomy_counts.items()
        ]

        return {
            "top_anomalous_stations": station_records[:10],
            "all_station_anomalies": station_records,
            "scatter_points": scatter_points,
            "distribution": distribution,
            "taxonomy_summary": taxonomy_summary,
            "total_observations_audited": n_samples,
            "total_stations": len(station_records),
            "extreme_outlier_count": int(sum(1 for s in station_records if s["composite_anomaly_score"] >= 0.55)),
            "methodology_note": (
                "Composite Anomaly Score blends Isolation Forest tree depth with Local Outlier Factor reachability density. "
                "Stations with score > 0.55 represent compound atmospheric anomalies requiring targeted heat mitigation."
            )
        }
