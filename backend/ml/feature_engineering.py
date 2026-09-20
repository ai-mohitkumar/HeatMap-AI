"""
Feature Engineering Pipeline for HeatShield AI
Computes biometeorological indicators:
- Relative Humidity (Magnus-Tetens formula)
- NOAA Heat Index (Rothfusz regression)
- Canadian Humidex
- Continuous Heat Stress Index (HSI: 0-100 scale)
- Diurnal Temperature Range (DTR)
- ANOVA Feature Cluster Separation Power
"""

import numpy as np
import pandas as pd
from typing import List, Tuple, Dict, Any
from scipy import stats

class HeatStressFeatureEngineer:
    """
    Computes biometeorological indices and continuous Heat Stress Index (HSI: 0-100).
    """

    CORE_CLUSTERING_FEATURES = [
        "mean_temp_c",
        "max_temp_c",
        "temperature_range",
        "dew_point_c",
        "relative_humidity",
        "heat_index_c",
        "wind_speed_kmh",
        "pressure_hpa"
    ]

    EXTENDED_FEATURES = CORE_CLUSTERING_FEATURES + [
        "humidex_c",
        "heat_intensity",
        "heat_stress_index",
        "is_extreme_heat_day"
    ]

    @staticmethod
    def calculate_relative_humidity(temp_c: pd.Series, dewp_c: pd.Series) -> pd.Series:
        """
        Calculates Relative Humidity (RH in %) using Magnus-Tetens formula.
        """
        a = 17.625
        b = 243.04
        num = np.exp((a * dewp_c) / (b + dewp_c))
        den = np.exp((a * temp_c) / (b + temp_c))
        rh = 100.0 * (num / den)
        return rh.clip(lower=1.0, upper=100.0).round(2)

    @staticmethod
    def calculate_noaa_heat_index(temp_c: pd.Series, rh: pd.Series) -> pd.Series:
        """
        Calculates official NOAA Rothfusz regression equation in Celsius.
        """
        t_f = temp_c * (9.0 / 5.0) + 32.0
        hi_simple = 0.5 * (t_f + 61.0 + ((t_f - 68.0) * 1.2) + (rh * 0.094))

        c1 = -42.379
        c2 = 2.04901523
        c3 = 10.14333127
        c4 = -0.22475541
        c5 = -0.00683783
        c6 = -0.05481717
        c7 = 0.00122874
        c8 = 0.00085282
        c9 = -0.00000199

        hi_full = (
            c1 + c2 * t_f + c3 * rh + c4 * t_f * rh + c5 * (t_f ** 2) +
            c6 * (rh ** 2) + c7 * (t_f ** 2) * rh + c8 * t_f * (rh ** 2) +
            c9 * (t_f ** 2) * (rh ** 2)
        )

        adj_high = ((rh - 85.0) / 10.0) * ((87.0 - t_f) / 5.0)
        adj_high_mask = (rh > 85.0) & (t_f >= 80.0) & (t_f <= 87.0)

        term = np.maximum(0.0, (17.0 - np.abs(t_f - 95.0)) / 17.0)
        adj_low = ((13.0 - rh) / 4.0) * np.sqrt(term)
        adj_low_mask = (rh < 13.0) & (t_f >= 80.0) & (t_f <= 112.0)

        hi_adjusted = hi_full.copy()
        hi_adjusted = np.where(adj_high_mask, hi_full + adj_high, hi_adjusted)
        hi_adjusted = np.where(adj_low_mask, hi_full - adj_low, hi_adjusted)

        hi_final_f = np.where(hi_simple >= 80.0, hi_adjusted, hi_simple)
        hi_final_c = (hi_final_f - 32.0) * (5.0 / 9.0)
        return pd.Series(hi_final_c, index=temp_c.index).round(2)

    @staticmethod
    def calculate_humidex(temp_c: pd.Series, dewp_c: pd.Series) -> pd.Series:
        """
        Calculates Canadian Humidex rating.
        """
        e = 6.11 * np.exp(5417.7530 * ((1.0 / 273.16) - (1.0 / (273.15 + dewp_c))))
        humidex = temp_c + (5.0 / 9.0) * (e - 10.0)
        return humidex.round(2)

    @staticmethod
    def calculate_continuous_heat_stress_index(
        temp_c: pd.Series,
        max_temp_c: pd.Series,
        dew_point_c: pd.Series,
        heat_index_c: pd.Series,
        wind_speed_kmh: pd.Series
    ) -> pd.Series:
        """
        Calculates a continuous Heat Stress Index (HSI: 0 to 100).
        Scientifically calibrated against biological heat-stress limits:
        - Freezing/cool baseline (<=15°C) -> HSI ~ 0-20
        - Moderate warm conditions (25-32°C) -> HSI ~ 30-55
        - Severe thermal stress (36-42°C, HI 42-48°C) -> HSI ~ 65-85
        - Extreme hyperthermic wet-bulb trap (>44°C or HI >50°C) -> HSI ~ 88-100
        """
        # Min-max scaling with physically grounded anchors
        t_score = np.clip((temp_c - 15.0) / (45.0 - 15.0), 0.0, 1.0)
        max_t_score = np.clip((max_temp_c - 20.0) / (50.0 - 20.0), 0.0, 1.0)
        dewp_score = np.clip((dew_point_c - 5.0) / (30.0 - 5.0), 0.0, 1.0)
        hi_score = np.clip((heat_index_c - 20.0) / (55.0 - 20.0), 0.0, 1.0)
        
        # Wind mitigation factor: higher wind provides convective relief
        wind_penalty = np.clip(1.0 - (wind_speed_kmh / 30.0), 0.0, 1.0)

        # Composite multi-indicator weightings
        hsi_raw = (
            0.28 * t_score +
            0.26 * max_t_score +
            0.22 * dewp_score +
            0.18 * hi_score +
            0.06 * wind_penalty
        ) * 100.0

        return pd.Series(np.clip(hsi_raw, 0.0, 100.0), index=temp_c.index).round(1)

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Transforms cleaned metric DataFrame and derives all biometeorological features.
        """
        engineered = df.copy()

        if "temp_c" in engineered.columns and "mean_temp_c" not in engineered.columns:
            engineered["mean_temp_c"] = engineered["temp_c"]

        if "max_c" in engineered.columns and "min_c" in engineered.columns:
            engineered["max_temp_c"] = engineered["max_c"]
            engineered["min_temp_c"] = engineered["min_c"]
            engineered["temperature_range"] = (engineered["max_c"] - engineered["min_c"]).round(2)
        elif "max_temp_c" in engineered.columns and "min_temp_c" in engineered.columns:
            engineered["temperature_range"] = (engineered["max_temp_c"] - engineered["min_temp_c"]).round(2)

        dewp_col = "dewp_c" if "dewp_c" in engineered.columns else "dew_point_c"
        temp_col = "mean_temp_c" if "mean_temp_c" in engineered.columns else "temp_c"
        
        engineered["dew_point_c"] = engineered[dewp_col]
        engineered["relative_humidity"] = self.calculate_relative_humidity(
            engineered[temp_col], engineered[dewp_col]
        )

        engineered["heat_index_c"] = self.calculate_noaa_heat_index(
            engineered[temp_col], engineered["relative_humidity"]
        )

        engineered["humidex_c"] = self.calculate_humidex(
            engineered[temp_col], engineered[dewp_col]
        )

        max_col = "max_temp_c" if "max_temp_c" in engineered.columns else "max_c"
        engineered["heat_intensity"] = np.maximum(0.0, engineered[max_col] - 35.0).round(2)

        # Continuous Heat Stress Index (HSI: 0 to 100)
        wind_col = "wind_speed_kmh" if "wind_speed_kmh" in engineered.columns else "WDSP"
        engineered["heat_stress_index"] = self.calculate_continuous_heat_stress_index(
            engineered[temp_col],
            engineered[max_col],
            engineered["dew_point_c"],
            engineered["heat_index_c"],
            engineered[wind_col]
        )

        # Extreme Heat Day Flag (Max >= 40°C or Heat Index >= 42°C)
        engineered["is_extreme_heat_day"] = (
            (engineered[max_col] >= 40.0) | (engineered["heat_index_c"] >= 42.0)
        ).astype(int)

        return engineered

    def get_clustering_matrix(self, df: pd.DataFrame, feature_subset: List[str] = None) -> Tuple[pd.DataFrame, List[str]]:
        if feature_subset is None:
            features = [f for f in self.CORE_CLUSTERING_FEATURES if f in df.columns]
        else:
            features = [f for f in feature_subset if f in df.columns]
        return df[features].copy(), features

    @staticmethod
    def calculate_feature_cluster_separation(df: pd.DataFrame, cluster_col: str, feature_cols: List[str]) -> List[Dict[str, Any]]:
        """
        Calculates feature-level discriminative power across clusters using both:
        1. Parametric One-Way ANOVA (F-statistic & p-value)
        2. Non-parametric Kruskal-Wallis H-test (H-statistic & p-value)
        
        NOTE: This measures feature-level discriminative separation across cluster boundaries,
        NOT overall machine learning model accuracy.
        """
        results = []
        clusters = sorted(df[cluster_col].unique())

        for feat in feature_cols:
            if feat not in df.columns:
                continue
            grouped_data = [df[df[cluster_col] == c][feat].dropna().values for c in clusters]
            valid_groups = [g for g in grouped_data if len(g) > 1]
            if len(valid_groups) < 2:
                continue

            # 1. Parametric One-Way ANOVA
            try:
                f_stat, f_p = stats.f_oneway(*valid_groups)
                f_clean = float(f_stat) if not np.isnan(f_stat) else 0.0
                f_p_clean = float(f_p) if not np.isnan(f_p) else 1.0
            except Exception:
                f_clean, f_p_clean = 0.0, 1.0

            # 2. Non-parametric Kruskal-Wallis H-test (robust against non-normality)
            try:
                kw_stat, kw_p = stats.kruskal(*valid_groups)
                kw_clean = float(kw_stat) if not np.isnan(kw_stat) else 0.0
                kw_p_clean = float(kw_p) if not np.isnan(kw_p) else 1.0
            except Exception:
                kw_clean, kw_p_clean = 0.0, 1.0

            results.append({
                "feature": feat,
                "f_statistic": round(f_clean, 2),
                "p_value": f_p_clean,
                "kruskal_statistic": round(kw_clean, 2),
                "kruskal_p_value": kw_p_clean,
                "is_significant": bool(f_p_clean < 0.05 and kw_p_clean < 0.05),
                "separation_score": round(min(100.0, f_clean / 25.0), 1)
            })

        results.sort(key=lambda x: x["f_statistic"], reverse=True)
        return results

    @staticmethod
    def calculate_cluster_radar_centroids(df: pd.DataFrame, cluster_col: str = "cluster") -> Dict[str, Any]:
        """
        Calculates normalized (0-100) centroid biometeorological profiles for Radar/Spider chart visualization.
        Compares clusters across 6 core thermodynamic dimensions:
        - Mean Temp, Max Temp, Dew Point, Relative Humidity, Wind Speed, Heat Index
        """
        radar_features = [
            ("mean_temp_c", "Mean Temp (°C)"),
            ("max_temp_c", "Max Temp (°C)"),
            ("dew_point_c", "Dew Point (°C)"),
            ("relative_humidity", "Rel Humidity (%)"),
            ("wind_speed_kmh", "Wind Speed (km/h)"),
            ("heat_index_c", "Heat Index (°C)")
        ]

        clusters = sorted(df[cluster_col].unique())
        radar_data = []

        # Min-max normalization bounds across entire dataset
        feature_bounds = {}
        for feat_key, _ in radar_features:
            if feat_key in df.columns:
                f_min = float(df[feat_key].min())
                f_max = float(df[feat_key].max())
                feature_bounds[feat_key] = (f_min, f_max if f_max > f_min else f_min + 1.0)

        for feat_key, label in radar_features:
            if feat_key not in df.columns:
                continue
            f_min, f_max = feature_bounds[feat_key]
            item = {"indicator": label, "feature_key": feat_key}

            for c in clusters:
                cluster_mean = float(df[df[cluster_col] == c][feat_key].mean())
                # Normalize to 0 - 100 scale for intuitive radar comparison
                norm_val = round(((cluster_mean - f_min) / (f_max - f_min)) * 100.0, 1)
                item[f"Cluster_{c}"] = norm_val
                item[f"Cluster_{c}_raw"] = round(cluster_mean, 1)

            radar_data.append(item)

        return {
            "radar_data": radar_data,
            "clusters": [int(c) for c in clusters],
            "indicators": [label for _, label in radar_features]
        }
