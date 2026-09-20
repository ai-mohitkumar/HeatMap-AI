"""
Hierarchical Clustering Comparison API Routes
Provides endpoints comparing Agglomerative Hierarchical Clustering with K-Means.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from backend.ml.pipeline import get_pipeline

router = APIRouter(prefix="/api/hierarchical", tags=["Hierarchical Comparison"])

@router.get("/comparison", response_model=Dict[str, Any])
def get_hierarchical_comparison():
    """
    Returns comparative evaluation metrics:
    - K-Means vs Agglomerative Silhouette & Davies-Bouldin
    - Cophenetic Correlation Coefficient
    - Adjusted Rand Index (cluster agreement)
    - Normalized Mutual Information
    """
    try:
        pipeline = get_pipeline()
        return pipeline.hierarchical_comparison
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
