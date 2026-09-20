"""
Comprehensive Test Suite for HeatShield AI 2.0: Climate Intelligence Platform
Verifies:
- Multi-Algorithm Convergence Engine (RQ1)
- Latent Representation & Neural Manifolds (RQ2)
- Unsupervised Ensemble Anomaly Detection (RQ3)
- Markovian Climate Regime Transitions (RQ4)
- Systematic Feature Ablation Studies (RQ5)
- Coupled Spatial Emerging Hotspots Grid (RQ6)
- FastAPI REST Endpoints (/api/climate/*)
"""

import pytest
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

from backend.ml.pipeline import get_pipeline
from backend.ml.discovery_engine import ClimateDiscoveryEngine
from backend.ml.anomaly_engine import ClimateAnomalyEngine
from backend.ml.representation_engine import LatentRepresentationEngine
from backend.ml.ablation_engine import FeatureAblationEngine
from backend.main import app

@pytest.fixture(scope="module")
def pipeline():
    return get_pipeline()

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

# ---------------------------------------------------------------------------
# RQ1: Multi-Algorithm Climate Regime Convergence
# ---------------------------------------------------------------------------

def test_climate_discovery_engine(pipeline):
    engine = ClimateDiscoveryEngine(random_state=42)
    res = engine.run_multi_algorithm_comparison(pipeline.X_scaled, k=4)

    assert "comparison_table" in res
    assert len(res["comparison_table"]) == 4  # K-Means, GMM, HDBSCAN, Ward
    
    # Check metric ranges
    for row in res["comparison_table"]:
        assert "algorithm" in row
        assert "silhouette_score" in row
        assert "davies_bouldin_index" in row
        assert row["silhouette_score"] > 0.0 or row["algorithm"].startswith("HDBSCAN")

    # Verify ARI consensus matrix
    ari = res["ari_consensus_matrix"]
    assert len(ari) == 4
    for i in range(4):
        assert len(ari[i]) == 4
        assert ari[i][i] == 1.0  # Self-agreement is 1.0
        for j in range(4):
            assert ari[i][j] == ari[j][i]  # Symmetric

    # Verify GMM BIC/AIC curve
    bic_aic = res["gmm_bic_aic_curve"]
    assert len(bic_aic) == 7  # K=2 through K=8
    assert all("bic" in pt and "aic" in pt for pt in bic_aic)

    # Verify scientific synthesis
    assert len(res["scientific_convergence_verdict"]) > 20

# ---------------------------------------------------------------------------
# RQ3: Unsupervised Multi-Dimensional Anomaly Detection
# ---------------------------------------------------------------------------

def test_climate_anomaly_engine(pipeline):
    engine = ClimateAnomalyEngine(random_state=42)
    res = engine.detect_anomalies(pipeline.processed_df, pipeline.X_scaled)

    assert "top_anomalous_stations" in res
    assert "all_station_anomalies" in res
    assert "scatter_points" in res
    assert "taxonomy_summary" in res

    # Check station anomaly scores are bounded in [0.0, 1.0]
    for st in res["all_station_anomalies"]:
        assert 0.0 <= st["composite_anomaly_score"] <= 1.0
        assert 0.0 <= st["isolation_forest_score"] <= 1.0
        assert 0.0 <= st["lof_score"] <= 1.0
        assert st["taxonomy"] in [
            "Severe Compound Trap",
            "Thermal Spike Outlier",
            "Dry Arid Blast",
            "Microclimate Divergence",
            "Normal Regional Variation"
        ]
        assert len(st["explanation"]) > 10

    # Ensure ranking is sorted descending
    scores = [s["composite_anomaly_score"] for s in res["all_station_anomalies"]]
    assert scores == sorted(scores, reverse=True)

# ---------------------------------------------------------------------------
# RQ2: Latent Representation & Neural Manifolds
# ---------------------------------------------------------------------------

def test_latent_representation_engine(pipeline):
    engine = LatentRepresentationEngine(random_state=42)

    # 1. Bottleneck Autoencoder
    ae_res = engine.train_bottleneck_autoencoder(pipeline.X_scaled)
    assert "latent_coordinates_2d" in ae_res
    assert "latent_coordinates_3d" in ae_res
    assert len(ae_res["latent_coordinates_2d"]) == len(pipeline.X_scaled)
    assert len(ae_res["latent_coordinates_3d"]) == len(pipeline.X_scaled)
    assert ae_res["reconstruction_mse"] < 0.5  # Valid reconstruction

    # 2. Multi-Manifold Alignment
    manifold_res = engine.compute_comparative_latent_manifolds(
        df=pipeline.processed_df,
        X_scaled=pipeline.X_scaled,
        cluster_labels=pipeline.cluster_labels
    )
    assert "station_points" in manifold_res
    assert len(manifold_res["station_points"]) == 46  # All synoptic stations
    for pt in manifold_res["station_points"]:
        assert "pca" in pt and "spectral_umap" in pt and "autoencoder" in pt
        assert "x" in pt["autoencoder"] and "y" in pt["autoencoder"]

# ---------------------------------------------------------------------------
# RQ4: Markovian Climate Regime Transitions
# ---------------------------------------------------------------------------

def test_markov_transition_matrix(pipeline):
    engine = LatentRepresentationEngine(random_state=42)
    df = pipeline.full_processed_df if pipeline.full_processed_df is not None else pipeline.processed_df
    res = engine.compute_markov_transition_matrix(df=df, k=pipeline.active_k)

    assert "matrix_rows" in res
    assert "persistence_rates" in res
    assert len(res["matrix_rows"]) == pipeline.active_k

    # Check stochastic matrix validity (rows sum to 1.0)
    for row in res["matrix_rows"]:
        prob_sum = sum(row["probabilities"])
        assert abs(prob_sum - 1.0) < 1e-3, f"Row {row['regime_id']} does not sum to 1.0: {prob_sum}"
        assert 0.0 <= row["persistence_rate"] <= 1.0

# ---------------------------------------------------------------------------
# RQ5: Systematic Feature Ablation Studies
# ---------------------------------------------------------------------------

def test_feature_ablation_engine(pipeline):
    engine = FeatureAblationEngine(random_state=42)
    res = engine.run_ablation_study(pipeline.processed_df, k=pipeline.active_k)

    assert "ablation_results" in res
    assert len(res["ablation_results"]) == 6
    
    # Baseline check
    baseline = next(r for r in res["ablation_results"] if r["config_id"] == "baseline_all_8")
    assert baseline["silhouette_change_pct"] == 0.0

    # Moisture ablation causes measurable drop
    no_moisture = next(r for r in res["ablation_results"] if r["config_id"] == "no_moisture")
    assert no_moisture["silhouette_change_pct"] < -5.0, "Moisture ablation did not cause expected drop"

    # ANOVA ranking
    assert "feature_importance_ranking" in res
    assert len(res["feature_importance_ranking"]) > 0
    top_feature = res["feature_importance_ranking"][0]
    assert top_feature["f_statistic"] > 50.0

# ---------------------------------------------------------------------------
# RQ6: Coupled Emerging Hotspots Grid
# ---------------------------------------------------------------------------

def test_emerging_hotspots_grid(pipeline):
    anomaly_engine = ClimateAnomalyEngine(random_state=42)
    anom_res = anomaly_engine.detect_anomalies(pipeline.processed_df, pipeline.X_scaled)

    rep_engine = LatentRepresentationEngine(random_state=42)
    hot_res = rep_engine.compute_emerging_hotspots_grid(
        station_anomalies=anom_res["all_station_anomalies"],
        grid_resolution=15
    )

    assert "grid_points" in hot_res
    assert len(hot_res["grid_points"]) > 0
    assert "top_emerging_zones" in hot_res
    assert len(hot_res["top_emerging_zones"]) > 0
    assert hot_res["top_emerging_zones"][0]["emerging_hotspot_intensity"] > 0.0

# ---------------------------------------------------------------------------
# FastAPI REST Endpoints Integration Tests
# ---------------------------------------------------------------------------

def test_climate_api_endpoints(client):
    endpoints = [
        "/api/climate/discovery",
        "/api/climate/anomalies",
        "/api/climate/latent-representations",
        "/api/climate/transition-matrix",
        "/api/climate/ablation-study",
        "/api/climate/emerging-hotspots?grid_res=12"
    ]

    for ep in endpoints:
        res = client.get(ep)
        assert res.status_code == 200, f"Endpoint {ep} failed with status {res.status_code}: {res.text}"
        data = res.json()
        assert isinstance(data, dict)
        assert len(data) > 0
