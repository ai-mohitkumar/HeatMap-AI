"""
HeatShield AI Unified Machine Learning Pipeline Orchestrator
Integrates data ingestion, preprocessing, multi-year temporal tracking,
continuous HSI scoring, K-Means & Hierarchical clustering, PCA, UMAP, and AI insights.
"""

import os
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

from backend.ml.data_loader import load_noaa_gsod
from backend.ml.preprocessing import NOAADataPreprocessor
from backend.ml.feature_engineering import HeatStressFeatureEngineer
from backend.ml.kmeans import KMeansClusterEngine
from backend.ml.hierarchical import HierarchicalClusterEngine
from backend.ml.validation import OptimalKSelector
from backend.ml.pca_analysis import PCAReducer
from backend.ml.umap_analysis import UMAPReducer
from backend.ml.profiles import VulnerabilityProfiler
from backend.ml.explainability import StationExplainer
from backend.ml.temporal_analysis import TemporalAnalyzer
from backend.ml.ai_insights import AIInsightsEngine

class HeatShieldPipeline:
    """
    Unified ML pipeline encapsulating all unsupervised clustering, scoring,
    dimensionality reduction, and explainability workflows.
    """

    def __init__(self, data_path: Optional[str] = None):
        self.data_path = data_path
        self.preprocessor = NOAADataPreprocessor()
        self.engineer = HeatStressFeatureEngineer()
        self.kmeans_engine = KMeansClusterEngine(random_state=42)
        self.hier_engine = HierarchicalClusterEngine(linkage_method="ward")
        self.k_selector = OptimalKSelector()
        self.pca_reducer = PCAReducer(n_components=3)
        self.umap_reducer = UMAPReducer(n_components=2, random_state=42)

        # Pipeline state
        self.raw_df: Optional[pd.DataFrame] = None
        self.full_processed_df: Optional[pd.DataFrame] = None
        self.processed_df: Optional[pd.DataFrame] = None
        self.feature_matrix: Optional[pd.DataFrame] = None
        self.feature_columns: List[str] = []
        self.X_scaled: Optional[np.ndarray] = None
        self.active_year: Optional[int] = None # None means All Years

        # Results cache
        self.multi_k_evaluations: List[Dict[str, Any]] = []
        self.optimal_k_recommendation: Optional[Dict[str, Any]] = None
        self.active_k: int = 4
        self.cluster_labels: Optional[np.ndarray] = None
        self.profiles: List[Dict[str, Any]] = []
        self.pca_results: Optional[Dict[str, Any]] = None
        self.umap_results: Optional[Dict[str, Any]] = None
        self.hierarchical_comparison: Optional[Dict[str, Any]] = None
        self.feature_separation: List[Dict[str, Any]] = []
        self.annual_temporal_shifts: List[Dict[str, Any]] = []
        self.data_quality_metrics: Dict[str, Any] = {}
        self.cluster_stability: Dict[str, Any] = {}
        self.radar_centroids: Dict[str, Any] = {}

    def initialize(self) -> "HeatShieldPipeline":
        """
        Loads multi-year NOAA data, preprocesses, engineers features, and fits models.
        """
        # 1. Ingest multi-year NOAA GSOD dataset (2022-2025)
        self.raw_df = load_noaa_gsod(self.data_path)

        # 2. Compute scientific data quality audit
        self.data_quality_metrics = self.preprocessor.calculate_data_quality_metrics(self.raw_df)

        # 3. Preprocessing & SI conversions
        preprocessed = self.preprocessor.prepare_raw_data(self.raw_df)

        # 4. Feature engineering & continuous HSI score
        self.full_processed_df = self.engineer.engineer_features(preprocessed)
        self.processed_df = self.full_processed_df.copy()

        # 5. Extract clustering matrix & standardize
        self.feature_matrix, self.feature_columns = self.engineer.get_clustering_matrix(self.processed_df)
        self.X_scaled, _ = self.preprocessor.fit_transform_features(self.feature_matrix, self.feature_columns)

        # 6. Multi-K sweep across K=2..8
        self.multi_k_evaluations = self.kmeans_engine.evaluate_multi_k(self.X_scaled, k_range=range(2, 9))
        self.optimal_k_recommendation = self.k_selector.select_optimal_k(self.multi_k_evaluations)
        self.active_k = self.optimal_k_recommendation["optimal_k"]

        # 7. Fit optimal K and generate data-derived Profile A..D
        self.set_active_k(self.active_k)

        # 8. PCA 2D/3D & feature loadings biplot
        self.pca_results = self.pca_reducer.fit_transform(self.X_scaled, self.feature_columns)

        # 9. UMAP / Spectral Manifold non-linear projection
        self.umap_results = self.umap_reducer.fit_transform(self.X_scaled)

        # 10. Feature separation power (Parametric ANOVA & Non-parametric Kruskal-Wallis)
        self.feature_separation = self.engineer.calculate_feature_cluster_separation(
            self.processed_df, cluster_col="cluster", feature_cols=self.feature_columns
        )

        # 11. Multi-year annual shift analysis
        self.annual_temporal_shifts = TemporalAnalyzer.analyze_annual_cluster_shifts(
            self.full_processed_df, cluster_col="cluster"
        )

        # 12. Evaluate 20-seed Cluster Stability
        self.cluster_stability = self.kmeans_engine.evaluate_cluster_stability(
            self.X_scaled, k=self.active_k, n_seeds=20
        )

        # 13. Compute Radar / Spider Chart Centroid Profiles
        self.radar_centroids = self.engineer.calculate_cluster_radar_centroids(
            self.processed_df, cluster_col="cluster"
        )

        return self

    def set_active_k(self, k: int) -> Dict[str, Any]:
        """
        Dynamically sets cluster count K, re-clustering and regenerating profiles.
        """
        self.active_k = k
        self.cluster_labels, _ = self.kmeans_engine.fit_predict_k(self.X_scaled, k=k)
        self.full_processed_df["cluster"] = self.cluster_labels
        if hasattr(self, "active_year") and self.active_year is not None:
            self.processed_df = self.full_processed_df[self.full_processed_df["YEAR"] == self.active_year].copy()
        else:
            self.processed_df = self.full_processed_df.copy()

        self.profiles = VulnerabilityProfiler.generate_profiles(self.processed_df, cluster_col="cluster")

        self.hierarchical_comparison = self.hier_engine.compare_with_kmeans(
            self.X_scaled, self.cluster_labels, n_clusters=k
        )

        self.feature_separation = self.engineer.calculate_feature_cluster_separation(
            self.processed_df, cluster_col="cluster", feature_cols=self.feature_columns
        )

        self.annual_temporal_shifts = TemporalAnalyzer.analyze_annual_cluster_shifts(
            self.full_processed_df, cluster_col="cluster"
        )

        self.cluster_stability = self.kmeans_engine.evaluate_cluster_stability(
            self.X_scaled, k=k, n_seeds=20
        )

        self.radar_centroids = self.engineer.calculate_cluster_radar_centroids(
            self.processed_df, cluster_col="cluster"
        )

        return {
            "active_k": k,
            "profiles": self.profiles,
            "hierarchical_comparison": self.hierarchical_comparison,
            "feature_separation": self.feature_separation,
            "cluster_stability": self.cluster_stability,
            "radar_centroids": self.radar_centroids
        }

    def set_year_filter(self, year: Optional[int]) -> Dict[str, Any]:
        """
        Filters data by specific year (2022, 2023, 2024, 2025) or None for all years.
        """
        self.active_year = year
        if year is None:
            self.processed_df = self.full_processed_df.copy()
        else:
            self.processed_df = self.full_processed_df[self.full_processed_df["YEAR"] == year].copy()

        # Update profiles on filtered view
        self.profiles = VulnerabilityProfiler.generate_profiles(self.processed_df, cluster_col="cluster")
        return {
            "active_year": self.active_year,
            "observation_count": len(self.processed_df),
            "profiles": self.profiles
        }

    def explain_station(self, station_id: str) -> Dict[str, Any]:
        """
        Answers "Why is this region high priority?" for a station,
        including continuous HSI, contributing indicator percentiles, and assignment confidence.
        """
        active_model = self.kmeans_engine.fitted_models.get(self.active_k)
        return StationExplainer.explain_station(
            station_id,
            self.processed_df,
            self.profiles,
            X_scaled=self.X_scaled,
            kmeans_model=active_model,
            feature_cols=self.feature_columns
        )

    def query_ai_analyst(self, query: str, mode: Optional[str] = None) -> Dict[str, Any]:
        """
        Interactive grounded AI Analyst for HeatShield AI.
        Interprets natural language queries using strictly deterministic ML model outputs.
        """
        return AIInsightsEngine.query_ai_analyst(
            query=query,
            df=self.processed_df,
            profiles=self.profiles,
            feature_separation=self.feature_separation,
            annual_shifts=self.annual_temporal_shifts,
            mode=mode
        )

    def get_coverage_metrics(self) -> Dict[str, Any]:
        """
        Returns multi-year station observation coverage breakdown across 2022-2025.
        """
        years = sorted(self.full_processed_df["YEAR"].unique())
        yearly_breakdown = []
        total_obs = len(self.full_processed_df)

        for yr in years:
            yr_df = self.full_processed_df[self.full_processed_df["YEAR"] == yr]
            obs_cnt = len(yr_df)
            st_cnt = int(yr_df["STATION"].nunique())
            yearly_breakdown.append({
                "year": int(yr),
                "observation_count": obs_cnt,
                "stations_reporting": st_cnt,
                "share_percentage": round((obs_cnt / max(1, total_obs)) * 100.0, 1)
            })

        return {
            "total_stations": int(self.full_processed_df["STATION"].nunique()),
            "total_observations": total_obs,
            "period": f"{min(years)}–{max(years)}",
            "coverage_by_year": yearly_breakdown,
            "selection_criteria": (
                "46 authentic WMO/NOAA stations selected across five distinct Indian biometeorological regimes: "
                "Continental Desert (Arid High Heat), Indo-Gangetic Plain (Alluvial High DTR), Humid Coastal Trap (Severe Wet-Bulb), "
                "Deccan Plateau (Elevated Moderate Heat), and Alpine Refugia (Himalayan Temperate Baseline)."
            )
        }

    def get_station_transitions(self, station_id: str) -> Dict[str, Any]:
        """
        Returns "What Changed?" year-by-year trajectory for a station.
        """
        return TemporalAnalyzer.get_station_transition_history(station_id, self.full_processed_df, self.profiles)

    def get_all_transition_matrix(self) -> List[Dict[str, Any]]:
        """
        Returns complete multi-year transition matrix across all 46 stations.
        """
        return TemporalAnalyzer.get_all_stations_transition_matrix(self.full_processed_df, self.profiles)

    def get_ai_insights(self) -> Dict[str, Any]:
        """
        Returns automated AI Intelligence brief summarizing ML findings.
        """
        summary = self.get_dataset_summary()
        return AIInsightsEngine.generate_executive_insights(
            summary=summary,
            profiles=self.profiles,
            optimal_k_data=self.optimal_k_recommendation,
            feature_separation=self.feature_separation,
            temporal_summary=self.annual_temporal_shifts
        )

    def get_dataset_summary(self) -> Dict[str, Any]:
        """
        Returns summary statistics including continuous HSI metrics.
        """
        if self.processed_df is None:
            raise ValueError("Pipeline not initialized.")

        stations_count = int(self.processed_df["STATION"].nunique())
        total_obs = len(self.processed_df)
        years = [int(y) for y in sorted(self.full_processed_df["YEAR"].unique())]

        extreme_clusters = [p["cluster_id"] for p in self.profiles if p["vulnerability_tier"] in ["High", "Extreme"]]
        high_risk_stations = int(self.processed_df[self.processed_df["cluster"].isin(extreme_clusters)]["STATION"].nunique())

        best_sil = self.optimal_k_recommendation["best_evaluation"]["silhouette_score"] if self.optimal_k_recommendation else 0.0

        return {
            "total_observations": total_obs,
            "unique_stations": stations_count,
            "available_years": years,
            "active_year_filter": self.active_year,
            "features_used": self.feature_columns,
            "optimal_k": self.active_k,
            "best_silhouette_score": best_sil,
            "high_risk_stations_count": high_risk_stations,
            "mean_heat_index_c": round(float(self.processed_df["heat_index_c"].mean()), 1),
            "mean_heat_stress_index": round(float(self.processed_df["heat_stress_index"].mean()), 1) if "heat_stress_index" in self.processed_df.columns else 50.0,
            "max_recorded_temp_c": round(float(self.processed_df["max_temp_c"].max()), 1),
            "min_recorded_temp_c": round(float(self.processed_df["min_temp_c"].min()), 1)
        }

    def get_station_geo_records(self, limit: int = 500) -> List[Dict[str, Any]]:
        """
        Returns geographic station records with cluster profiles and continuous HSI scores.
        """
        if self.processed_df is None:
            raise ValueError("Pipeline not initialized.")

        profile_map = {p["cluster_id"]: p for p in self.profiles}

        station_aggs = self.processed_df.groupby("STATION").agg({
            "NAME": "first",
            "LATITUDE": "first",
            "LONGITUDE": "first",
            "ELEVATION": "first",
            "mean_temp_c": "mean",
            "max_temp_c": "max",
            "min_temp_c": "min",
            "dew_point_c": "mean",
            "relative_humidity": "mean",
            "heat_index_c": "max",
            "temperature_range": "mean",
            "wind_speed_kmh": "mean",
            "heat_stress_index": "max",
            "cluster": lambda x: x.mode()[0] if len(x.mode()) > 0 else x.iloc[0]
        }).reset_index()

        records = []
        for _, row in station_aggs.iterrows():
            c_id = int(row["cluster"])
            p_info = profile_map.get(c_id, {})
            tier = p_info.get("vulnerability_tier", "Moderate")
            color = p_info.get("color_code", "#F59E0B")
            p_code = p_info.get("profile_code", f"Cluster {c_id}")

            records.append({
                "station_id": str(row["STATION"]),
                "name": str(row["NAME"]),
                "latitude": round(float(row["LATITUDE"]), 4),
                "longitude": round(float(row["LONGITUDE"]), 4),
                "elevation_m": round(float(row["ELEVATION"]), 1),
                "mean_temp_c": round(float(row["mean_temp_c"]), 1),
                "peak_max_temp_c": round(float(row["max_temp_c"]), 1),
                "peak_heat_index_c": round(float(row["heat_index_c"]), 1),
                "dew_point_c": round(float(row["dew_point_c"]), 1),
                "relative_humidity_pct": round(float(row["relative_humidity"]), 1),
                "dtr_c": round(float(row["temperature_range"]), 1),
                "wind_speed_kmh": round(float(row["wind_speed_kmh"]), 1),
                "heat_stress_index": round(float(row["heat_stress_index"]), 1),
                "cluster_id": c_id,
                "profile_code": p_code,
                "vulnerability_tier": tier,
                "priority_level": f"{tier} Priority",
                "color_code": color
            })

        return records[:limit]

# Pipeline singleton instance
_pipeline_instance: Optional[HeatShieldPipeline] = None

def get_pipeline() -> HeatShieldPipeline:
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = HeatShieldPipeline()
        _pipeline_instance.initialize()
    return _pipeline_instance
