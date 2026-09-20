"""
Clustering API Routes
Handles K-Means parameter sweeps, automated optimal-K recommendation,
dynamic K updates, and heat-stress vulnerability profiles.
"""

from fastapi import APIRouter, Query, HTTPException, Body
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from backend.ml.pipeline import get_pipeline

router = APIRouter(prefix="/api/clustering", tags=["Clustering"])

class SetKRequest(BaseModel):
    k: int = Field(..., ge=2, le=8, description="Target cluster count between 2 and 8")

@router.get("/evaluations", response_model=List[Dict[str, Any]])
def get_multi_k_evaluations():
    """
    Returns WCSS, Silhouette Score, Davies-Bouldin Index, and Calinski-Harabasz Index for K=2..8.
    """
    try:
        pipeline = get_pipeline()
        return pipeline.multi_k_evaluations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/optimal-k", response_model=Dict[str, Any])
def get_optimal_k_recommendation():
    """
    Returns the algorithmic recommendation for optimal K, including composite ranking scores and rationale.
    """
    try:
        pipeline = get_pipeline()
        return pipeline.optimal_k_recommendation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profiles", response_model=List[Dict[str, Any]])
def get_cluster_profiles():
    """
    Returns heat-stress vulnerability profiles for the currently active K configuration.
    """
    try:
        pipeline = get_pipeline()
        return pipeline.profiles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/set-k", response_model=Dict[str, Any])
def set_active_k(req: SetKRequest):
    """
    Dynamically updates the cluster count K and recalculates profiles and comparisons.
    """
    try:
        pipeline = get_pipeline()
        result = pipeline.set_active_k(req.k)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stability", response_model=Dict[str, Any])
def get_cluster_stability(k: Optional[int] = Query(None, description="Cluster count for stability evaluation")):
    """
    Returns 20-seed K-Means cluster stability evaluation (Adjusted Rand Index consistency).
    """
    try:
        pipeline = get_pipeline()
        target_k = k if k is not None else pipeline.active_k
        if target_k == pipeline.active_k and pipeline.cluster_stability is not None:
            return pipeline.cluster_stability
        return pipeline.kmeans_engine.evaluate_cluster_stability(pipeline.X_scaled, k=target_k, n_seeds=20)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/radar-centroids", response_model=Dict[str, Any])
def get_radar_centroids(k: Optional[int] = Query(None, description="Cluster count for radar centroids")):
    """
    Returns normalized (0-100) centroid biometeorological profiles for Radar/Spider chart comparison.
    """
    try:
        pipeline = get_pipeline()
        return pipeline.radar_centroids
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
