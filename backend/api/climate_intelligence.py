"""
Climate Intelligence API Routes (HeatShield AI 2.0)
Exposes REST endpoints for:
- Multi-Algorithm Regime Discovery (RQ1)
- Latent Representation & Neural Manifolds (RQ2)
- Unsupervised Ensemble Anomaly Detection (RQ3)
- Markovian Climate Regime Transitions (RQ4)
- Systematic Feature Ablation Studies (RQ5)
- Coupled Spatial Emerging Hotspots Grid (RQ6)
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional
from backend.ml.pipeline import get_pipeline
from backend.ml.discovery_engine import ClimateDiscoveryEngine
from backend.ml.anomaly_engine import ClimateAnomalyEngine
from backend.ml.representation_engine import LatentRepresentationEngine
from backend.ml.ablation_engine import FeatureAblationEngine

router = APIRouter(prefix="/api/climate", tags=["Climate Intelligence & Research"])

# Memory cache for fast response times
_CLIMATE_CACHE: Dict[str, Any] = {}

def _get_cache_key(prefix: str, pipeline) -> str:
    k = getattr(pipeline, "active_k", 4)
    n = len(pipeline.processed_df) if pipeline.processed_df is not None else 0
    return f"{prefix}_{k}_{n}"

@router.get("/discovery")
def get_climate_discovery(k: Optional[int] = Query(None, ge=2, le=8)):
    """
    RQ1: Multi-Algorithm Climate Discovery
    Runs K-Means, GMM with BIC/AIC, HDBSCAN, and Ward's Linkage.
    Returns comparative metrics and pairwise consensus matrices (ARI, NMI).
    """
    try:
        pipeline = get_pipeline()
        target_k = k or pipeline.active_k
        cache_key = f"discovery_{target_k}_{len(pipeline.processed_df)}"

        if cache_key in _CLIMATE_CACHE:
            return _CLIMATE_CACHE[cache_key]

        engine = ClimateDiscoveryEngine(random_state=42)
        res = engine.run_multi_algorithm_comparison(pipeline.X_scaled, k=target_k)
        _CLIMATE_CACHE[cache_key] = res
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Discovery engine error: {str(e)}")

@router.get("/anomalies")
def get_climate_anomalies():
    """
    RQ3: Unsupervised Multi-Dimensional Anomaly Detection
    Couples Isolation Forest and Local Outlier Factor with baseline deviations (ΔT, ΔHI, ΔRH).
    Returns top anomalous stations, scatter coordinates, and thermodynamic taxonomy.
    """
    try:
        pipeline = get_pipeline()
        cache_key = _get_cache_key("anomalies", pipeline)

        if cache_key in _CLIMATE_CACHE:
            return _CLIMATE_CACHE[cache_key]

        engine = ClimateAnomalyEngine(random_state=42)
        res = engine.detect_anomalies(pipeline.processed_df, pipeline.X_scaled)
        _CLIMATE_CACHE[cache_key] = res
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly engine error: {str(e)}")

@router.get("/latent-representations")
def get_latent_representations():
    """
    RQ2: Non-Linear Latent Manifold Projection
    Compares 2D/3D representations across Bottleneck Autoencoder (8->16->3->16->8),
    Linear PCA, and Spectral/UMAP non-linear manifold.
    """
    try:
        pipeline = get_pipeline()
        cache_key = _get_cache_key("latent", pipeline)

        if cache_key in _CLIMATE_CACHE:
            return _CLIMATE_CACHE[cache_key]

        engine = LatentRepresentationEngine(random_state=42)
        res = engine.compute_comparative_latent_manifolds(
            df=pipeline.processed_df,
            X_scaled=pipeline.X_scaled,
            cluster_labels=pipeline.cluster_labels
        )
        _CLIMATE_CACHE[cache_key] = res
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Latent representation error: {str(e)}")

@router.get("/transition-matrix")
def get_transition_matrix():
    """
    RQ4: Markovian Climate Regime Transitions (2022-2025)
    Computes empirical transition probability matrix P(C_{t+1} = j | C_t = i),
    persistence rates, and inter-annual migration pathways.
    """
    try:
        pipeline = get_pipeline()
        cache_key = _get_cache_key("transitions", pipeline)

        if cache_key in _CLIMATE_CACHE:
            return _CLIMATE_CACHE[cache_key]

        engine = LatentRepresentationEngine(random_state=42)
        # Use full multi-year dataframe for historical transitions
        df = pipeline.full_processed_df if pipeline.full_processed_df is not None else pipeline.processed_df
        res = engine.compute_markov_transition_matrix(df=df, k=pipeline.active_k)
        _CLIMATE_CACHE[cache_key] = res
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transition matrix error: {str(e)}")

@router.get("/ablation-study")
def get_ablation_study():
    """
    RQ5: Systematic Feature Ablation Study
    Evaluates 6 feature configurations and measures Silhouette score degradation
    and ANOVA F-statistic factor dominance.
    """
    try:
        pipeline = get_pipeline()
        cache_key = _get_cache_key("ablation", pipeline)

        if cache_key in _CLIMATE_CACHE:
            return _CLIMATE_CACHE[cache_key]

        engine = FeatureAblationEngine(random_state=42)
        res = engine.run_ablation_study(pipeline.processed_df, k=pipeline.active_k)
        _CLIMATE_CACHE[cache_key] = res
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ablation study error: {str(e)}")

@router.get("/emerging-hotspots")
def get_emerging_hotspots(grid_res: int = Query(20, ge=10, le=30)):
    """
    RQ6: Coupled Emerging Hotspots Grid
    Spatial IDW interpolation (k=4, p=2.0) fusing Heat Stress Index with composite anomaly scores.
    """
    try:
        pipeline = get_pipeline()
        cache_key = f"hotspots_{grid_res}_{len(pipeline.processed_df)}"

        if cache_key in _CLIMATE_CACHE:
            return _CLIMATE_CACHE[cache_key]

        # First obtain station anomalies
        anomaly_engine = ClimateAnomalyEngine(random_state=42)
        anomaly_res = anomaly_engine.detect_anomalies(pipeline.processed_df, pipeline.X_scaled)

        # Then compute spatial grid
        rep_engine = LatentRepresentationEngine(random_state=42)
        res = rep_engine.compute_emerging_hotspots_grid(
            station_anomalies=anomaly_res["all_station_anomalies"],
            grid_resolution=grid_res
        )
        _CLIMATE_CACHE[cache_key] = res
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emerging hotspots error: {str(e)}")
