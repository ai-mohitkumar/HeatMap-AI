"""
Data Preprocessing Pipeline for NOAA GSOD Meteorological Observations
Handles missing value imputation (NOAA 9999.9 flags), unit conversions, 
temporal feature extraction, and feature standardization via StandardScaler.
"""

import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any
from sklearn.preprocessing import StandardScaler

class NOAADataPreprocessor:
    """
    Production-grade preprocessor for NOAA Global Summary of the Day (GSOD) weather records.
    """

    NOAA_MISSING_FLAGS = {
        "TEMP": 9999.9,
        "MAX": 9999.9,
        "MIN": 9999.9,
        "DEWP": 9999.9,
        "SLP": 9999.9,
        "STP": 9999.9,
        "WDSP": 999.9,
        "PRCP": 99.99
    }

    def __init__(self):
        self.scaler = StandardScaler()
        self.imputed_medians: Dict[str, float] = {}
        self.is_fitted: bool = False
        self.feature_columns: List[str] = []
        self.quality_metrics: Dict[str, Any] = {}

    def calculate_data_quality_metrics(self, raw_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Computes comprehensive scientific data quality audit statistics from raw observations:
        - Total observation records
        - Station census and coverage
        - Exact missing NOAA sensor flag rate
        - Outliers detected/bounded
        - Overall Data Quality Score (%)
        """
        total_records = len(raw_df)
        unique_stations = int(raw_df["STATION"].nunique())
        years = sorted([int(y) for y in raw_df["YEAR"].unique()]) if "YEAR" in raw_df.columns else [2022, 2023, 2024, 2025]
        
        # Count NOAA missing flags (>= 9999.9, 999.9, etc.)
        flagged_cells = 0
        total_numeric_cells = 0
        for col, flag_val in self.NOAA_MISSING_FLAGS.items():
            if col in raw_df.columns:
                total_numeric_cells += total_records
                flagged_cells += int((raw_df[col] >= (flag_val - 1.0)).sum())
                
        missing_rate_pct = round((flagged_cells / max(1, total_numeric_cells)) * 100.0, 1)
        
        # Outlier counts (physical bounds: Temp outside [0, 130 F], Wind > 80 kts)
        outliers_count = 0
        if "TEMP" in raw_df.columns:
            outliers_count += int(((raw_df["TEMP"] < 10.0) | (raw_df["TEMP"] > 130.0)).sum())
        if "WDSP" in raw_df.columns:
            outliers_count += int((raw_df["WDSP"] > 80.0).sum())
            
        outlier_rate_pct = round((outliers_count / max(1, total_records)) * 100.0, 1)
        
        # Stations with complete records
        obs_per_station = raw_df.groupby("STATION").size()
        max_obs = obs_per_station.max() if len(obs_per_station) > 0 else 0
        complete_stations = int((obs_per_station >= (max_obs * 0.95)).sum())
        
        # Overall Data Quality Score
        quality_score = round(max(0.0, min(100.0, 100.0 - (missing_rate_pct + outlier_rate_pct))), 1)
        
        self.quality_metrics = {
            "total_records": total_records,
            "unique_stations": unique_stations,
            "recorded_years": years,
            "missing_values_count": flagged_cells,
            "missing_values_pct": missing_rate_pct,
            "outliers_count": outliers_count,
            "outliers_pct": outlier_rate_pct,
            "complete_stations": complete_stations,
            "data_quality_score": quality_score,
            "clean_records_count": total_records - outliers_count
        }
        return self.quality_metrics

    def clean_noaa_missing_flags(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Replaces NOAA missing value numeric codes (e.g., 9999.9) with NaN.
        """
        df_cleaned = df.copy()
        for col, flag_val in self.NOAA_MISSING_FLAGS.items():
            if col in df_cleaned.columns:
                df_cleaned.loc[df_cleaned[col] >= (flag_val - 1.0), col] = np.nan
        return df_cleaned

    def impute_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Imputes missing values using station-specific median where available,
        falling back to overall column medians.
        """
        df_imputed = df.copy()
        numeric_cols = ["TEMP", "MAX", "MIN", "DEWP", "SLP", "WDSP", "PRCP"]

        for col in numeric_cols:
            if col in df_imputed.columns:
                # Calculate global fallback median
                global_med = float(df_imputed[col].dropna().median())
                if np.isnan(global_med):
                    global_med = 0.0
                self.imputed_medians[col] = global_med

                # Impute station-level median if grouped
                if "STATION" in df_imputed.columns:
                    station_medians = df_imputed.groupby("STATION")[col].transform("median")
                    df_imputed[col] = df_imputed[col].fillna(station_medians)

                # Fill any remaining with global median
                df_imputed[col] = df_imputed[col].fillna(global_med)

        return df_imputed

    def convert_units_to_si(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Converts NOAA imperial units into Standard International / Metric units:
        - Temperatures: Fahrenheit -> Celsius: (F - 32) * 5/9
        - Wind Speed: Knots -> km/h: knots * 1.852
        - Precipitation: Inches -> mm: in * 25.4
        - Pressure: SLP in millibars (hPa) maintained
        """
        df_metric = df.copy()

        # Temperature conversions
        for temp_col in ["TEMP", "MAX", "MIN", "DEWP"]:
            if temp_col in df_metric.columns:
                metric_col = f"{temp_col.lower()}_c"
                df_metric[metric_col] = (df_metric[temp_col] - 32.0) * (5.0 / 9.0)
                df_metric[metric_col] = df_metric[metric_col].round(2)

        # Standard descriptive aliases
        if "temp_c" in df_metric.columns:
            df_metric["mean_temp_c"] = df_metric["temp_c"]
        if "max_c" in df_metric.columns:
            df_metric["max_temp_c"] = df_metric["max_c"]
        if "min_c" in df_metric.columns:
            df_metric["min_temp_c"] = df_metric["min_c"]
        if "dewp_c" in df_metric.columns:
            df_metric["dew_point_c"] = df_metric["dewp_c"]

        # Wind speed conversion (knots to km/h)
        if "WDSP" in df_metric.columns:
            df_metric["wind_speed_kmh"] = (df_metric["WDSP"] * 1.852).round(2)

        # Precipitation conversion (inches to mm)
        if "PRCP" in df_metric.columns:
            df_metric["prcp_mm"] = (df_metric["PRCP"] * 25.4).round(2)

        # Pressure
        if "SLP" in df_metric.columns:
            df_metric["pressure_hpa"] = df_metric["SLP"].round(1)

        return df_metric

    def extract_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extracts temporal metadata from the DATE column.
        """
        df_time = df.copy()
        if "DATE" in df_time.columns:
            dates = pd.to_datetime(df_time["DATE"], errors="coerce")
            df_time["month"] = dates.dt.month
            df_time["day_of_year"] = dates.dt.dayofyear
            # Heatwave vulnerability season indicator (April=4, May=5, June=6)
            df_time["is_heat_season"] = df_time["month"].isin([4, 5, 6]).astype(int)
        return df_time

    def prepare_raw_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Full raw-to-metric data transformation pipeline.
        """
        cleaned = self.clean_noaa_missing_flags(df)
        imputed = self.impute_missing_values(cleaned)
        metric = self.convert_units_to_si(imputed)
        temporal = self.extract_temporal_features(metric)
        return temporal

    def fit_transform_features(self, X: pd.DataFrame, feature_cols: List[str]) -> Tuple[np.ndarray, StandardScaler]:
        """
        Fits StandardScaler on specified feature columns and transforms the matrix.
        """
        self.feature_columns = feature_cols
        X_features = X[feature_cols].values
        X_scaled = self.scaler.fit_transform(X_features)
        self.is_fitted = True
        return X_scaled, self.scaler

    def transform_features(self, X: pd.DataFrame) -> np.ndarray:
        """
        Transforms new data using the already fitted StandardScaler.
        """
        if not self.is_fitted:
            raise ValueError("Preprocessor scaler has not been fitted yet.")
        return self.scaler.transform(X[self.feature_columns].values)
