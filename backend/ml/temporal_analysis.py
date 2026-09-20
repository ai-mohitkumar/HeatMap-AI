"""
Multi-Year Temporal Analysis & Station Transition Engine
Tracks annual cluster membership shifts (2022-2025) and station-by-station profile transitions.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List

class TemporalAnalyzer:
    """
    Analyzes multi-year temporal trends and station-level cluster transitions across 2022 to 2025.
    """

    @staticmethod
    def analyze_annual_cluster_shifts(df: pd.DataFrame, cluster_col: str = "cluster") -> List[Dict[str, Any]]:
        """
        Calculates cluster proportions and mean Heat Stress Index per year (2022-2025).
        """
        if "YEAR" not in df.columns:
            return []

        years = sorted(df["YEAR"].unique())
        clusters = sorted(df[cluster_col].unique())
        annual_summary = []

        for year in years:
            subset = df[df["YEAR"] == year]
            total_obs = len(subset)
            if total_obs == 0:
                continue

            dist = {}
            for c in clusters:
                c_count = int(np.sum(subset[cluster_col] == c))
                dist[f"cluster_{c}_pct"] = round((c_count / total_obs) * 100, 1)
                dist[f"cluster_{c}_count"] = c_count

            mean_hsi = float(subset["heat_stress_index"].mean()) if "heat_stress_index" in subset.columns else 0.0
            mean_temp = float(subset["mean_temp_c"].mean()) if "mean_temp_c" in subset.columns else 0.0
            max_temp = float(subset["max_temp_c"].max()) if "max_temp_c" in subset.columns else 0.0

            annual_summary.append({
                "year": int(year),
                "total_observations": total_obs,
                "mean_heat_stress_index": round(mean_hsi, 1),
                "mean_temperature_c": round(mean_temp, 1),
                "peak_temperature_c": round(max_temp, 1),
                **dist
            })

        return annual_summary

    @staticmethod
    def get_station_transition_history(station_id: str, df: pd.DataFrame, profiles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Retrieves year-by-year trajectory (2022-2025) for a specific station,
        detecting cluster transitions and thermodynamic changes over time.
        """
        station_data = df[df["STATION"].astype(str) == str(station_id)]
        if station_data.empty:
            return {"error": f"Station {station_id} not found."}

        name = str(station_data["NAME"].iloc[0])
        years = sorted(station_data["YEAR"].unique())
        profile_map = {p["cluster_id"]: p for p in profiles}

        history = []
        for year in years:
            y_rows = station_data[station_data["YEAR"] == year]
            if y_rows.empty:
                continue

            c_id = int(y_rows["cluster"].mode()[0])
            p_info = profile_map.get(c_id, {})
            tier = p_info.get("vulnerability_tier", "Moderate")

            history.append({
                "year": int(year),
                "cluster_id": c_id,
                "vulnerability_tier": tier,
                "priority_level": f"{tier} Priority",
                "color_code": p_info.get("color_code", "#F59E0B"),
                "mean_temp_c": round(float(y_rows["mean_temp_c"].mean()), 1),
                "peak_max_temp_c": round(float(y_rows["max_temp_c"].max()), 1),
                "dew_point_c": round(float(y_rows["dew_point_c"].mean()), 1),
                "heat_index_c": round(float(y_rows["heat_index_c"].max()), 1),
                "heat_stress_index": round(float(y_rows["heat_stress_index"].max()), 1) if "heat_stress_index" in y_rows.columns else 50.0
            })

        # Detect transition behavior
        transitions = []
        for i in range(1, len(history)):
            prev_tier = history[i-1]["vulnerability_tier"]
            curr_tier = history[i]["vulnerability_tier"]
            prev_year = history[i-1]["year"]
            curr_year = history[i]["year"]

            if prev_tier != curr_tier:
                transitions.append(
                    f"Transition detected between {prev_year} and {curr_year}: "
                    f"Shifted from {prev_tier} to {curr_tier} (ΔHSI: {history[i]['heat_stress_index'] - history[i-1]['heat_stress_index']:+.1f})."
                )

        if not transitions:
            summary = f"{name} maintained a stable {history[0]['vulnerability_tier']} profile across 2022–2025."
        else:
            summary = f"{name} exhibited dynamic vulnerability shifts: " + " ".join(transitions)

        return {
            "station_id": str(station_id),
            "name": name,
            "annual_history": history,
            "transitions": transitions,
            "transition_summary": summary
        }

    @staticmethod
    def get_all_stations_transition_matrix(df: pd.DataFrame, profiles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Builds a multi-year vulnerability transition matrix across all monitoring stations (2022–2025).
        Enables visual audit of micro-climatic profile migrations.
        """
        profile_map = {p["cluster_id"]: p for p in profiles}
        matrix = []

        unique_stations = df[["STATION", "NAME"]].drop_duplicates()
        for _, row in unique_stations.iterrows():
            st_id = str(row["STATION"])
            st_name = str(row["NAME"])
            st_df = df[df["STATION"].astype(str) == st_id]

            rec = {
                "station_id": st_id,
                "name": st_name,
                "latitude": float(st_df["LATITUDE"].iloc[0]),
                "longitude": float(st_df["LONGITUDE"].iloc[0])
            }

            tiers = []
            codes = []
            for yr in [2022, 2023, 2024, 2025]:
                yr_df = st_df[st_df["YEAR"] == yr]
                if not yr_df.empty:
                    cid = int(yr_df["cluster"].mode()[0])
                    p_info = profile_map.get(cid, {})
                    code = p_info.get("profile_code", f"Cluster {cid}")
                    tier = p_info.get("vulnerability_tier", "Moderate")
                    color = p_info.get("color_code", "#F59E0B")
                    rec[f"y{yr}_code"] = code
                    rec[f"y{yr}_tier"] = tier
                    rec[f"y{yr}_color"] = color
                    rec[f"y{yr}_temp"] = round(float(yr_df["mean_temp_c"].mean()), 1)
                    rec[f"y{yr}_hsi"] = round(float(yr_df["heat_stress_index"].mean()), 1) if "heat_stress_index" in yr_df.columns else 50.0
                    tiers.append(tier)
                    codes.append(code)
                else:
                    rec[f"y{yr}_code"] = "N/A"
                    rec[f"y{yr}_tier"] = "N/A"
                    rec[f"y{yr}_color"] = "#64748B"
                    rec[f"y{yr}_temp"] = 0.0
                    rec[f"y{yr}_hsi"] = 0.0

            has_shift = len(set(codes)) > 1
            rec["has_transition"] = has_shift
            rec["transition_trajectory"] = " → ".join(codes) if codes else "Stable"
            rec["overall_shift"] = (
                f"{codes[0]} → {codes[-1]} (Profile Shift)" if has_shift and len(codes) >= 2 else "Stable Across Seasons"
            )
            rec["mean_hsi"] = round(float(st_df["heat_stress_index"].mean()), 1) if "heat_stress_index" in st_df.columns else 50.0

            matrix.append(rec)

        matrix.sort(key=lambda x: (not x["has_transition"], -x["mean_hsi"]))
        return matrix
