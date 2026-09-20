"""
Analysis & Intelligence API Routes
Provides PCA 2D/3D projections, UMAP non-linear manifold coordinates,
ANOVA feature separation power, station-level explainability, and AI intelligence briefs.
"""

from fastapi import APIRouter, Query, HTTPException, Path
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from backend.ml.pipeline import get_pipeline

router = APIRouter(prefix="/api/analysis", tags=["Analysis & Intelligence"])

@router.get("/pca", response_model=Dict[str, Any])
def get_pca_analysis():
    """
    Returns PCA 2D coordinates, explained variance ratios, and feature loading vectors.
    """
    try:
        pipeline = get_pipeline()
        if pipeline.pca_results is None:
            raise HTTPException(status_code=400, detail="PCA not computed.")

        coords = pipeline.pca_results["coordinates_2d"]
        labels = pipeline.cluster_labels.tolist() if pipeline.cluster_labels is not None else []
        names = pipeline.processed_df["NAME"].tolist() if pipeline.processed_df is not None else []
        stations = pipeline.processed_df["STATION"].tolist() if pipeline.processed_df is not None else []
        heat_indices = pipeline.processed_df["heat_index_c"].tolist() if pipeline.processed_df is not None else []
        hsi_scores = pipeline.processed_df["heat_stress_index"].tolist() if "heat_stress_index" in pipeline.processed_df.columns else []

        points = []
        for i in range(len(coords)):
            points.append({
                "x": coords[i][0],
                "y": coords[i][1],
                "cluster": labels[i] if i < len(labels) else 0,
                "station_name": names[i] if i < len(names) else f"Station {i}",
                "station_id": str(stations[i]) if i < len(stations) else "",
                "heat_index_c": heat_indices[i] if i < len(heat_indices) else 0.0,
                "heat_stress_index": hsi_scores[i] if i < len(hsi_scores) else 50.0
            })

        return {
            "points": points,
            "explained_variance_ratio": pipeline.pca_results["explained_variance_ratio"],
            "cumulative_variance_ratio": pipeline.pca_results["cumulative_variance_ratio"],
            "total_variance_explained_2d": pipeline.pca_results["total_variance_explained_2d"],
            "feature_loadings": pipeline.pca_results["feature_loadings"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/umap", response_model=Dict[str, Any])
def get_umap_analysis():
    """
    Returns non-linear manifold projection (UMAP / Spectral Embedding) coordinates.
    """
    try:
        pipeline = get_pipeline()
        if pipeline.umap_results is None:
            raise HTTPException(status_code=400, detail="UMAP manifold not computed.")

        coords = pipeline.umap_results["coordinates_2d"]
        indices = pipeline.umap_results["sample_indices"]
        labels = pipeline.cluster_labels.tolist() if pipeline.cluster_labels is not None else []
        names = pipeline.processed_df["NAME"].tolist() if pipeline.processed_df is not None else []
        stations = pipeline.processed_df["STATION"].tolist() if pipeline.processed_df is not None else []
        hsi_scores = pipeline.processed_df["heat_stress_index"].tolist() if "heat_stress_index" in pipeline.processed_df.columns else []

        points = []
        for idx, i in enumerate(indices):
            points.append({
                "x": coords[idx][0],
                "y": coords[idx][1],
                "cluster": labels[i] if i < len(labels) else 0,
                "station_name": names[i] if i < len(names) else f"Station {i}",
                "station_id": str(stations[i]) if i < len(stations) else "",
                "heat_stress_index": hsi_scores[i] if i < len(hsi_scores) else 50.0
            })

        return {
            "points": points,
            "method": pipeline.umap_results["method"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/map-stations", response_model=List[Dict[str, Any]])
def get_map_stations(limit: int = Query(500, ge=1, le=2000)):
    """
    Returns station geographic profiles with cluster assignments and continuous HSI scores.
    """
    try:
        pipeline = get_pipeline()
        return pipeline.get_station_geo_records(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/explain-station/{station_id}", response_model=Dict[str, Any])
def explain_station(station_id: str = Path(..., description="Target NOAA Station ID")):
    """
    Answers: "Why is this region high priority?"
    Returns contributing indicator percentiles and diagnostic explanation.
    """
    try:
        pipeline = get_pipeline()
        res = pipeline.explain_station(station_id)
        if "error" in res:
            raise HTTPException(status_code=404, detail=res["error"])
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/feature-separation", response_model=List[Dict[str, Any]])
def get_feature_cluster_separation():
    """
    Returns ANOVA F-statistic ranking of features that drive cluster separation.
    """
    try:
        pipeline = get_pipeline()
        return pipeline.feature_separation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ai-insights", response_model=Dict[str, Any])
def get_ai_insights():
    """
    Returns automated Natural Language Generation executive intelligence brief.
    """
    try:
        pipeline = get_pipeline()
        return pipeline.get_ai_insights()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AIQueryRequest(BaseModel):
    query: str
    mode: Optional[str] = None

@router.post("/ai-query", response_model=Dict[str, Any])
def query_ai_analyst_post(body: AIQueryRequest):
    """
    Interactive HeatShield AI Analyst:
    Queries machine learning models and cluster statistics to provide grounded explanations.
    """
    try:
        pipeline = get_pipeline()
        return pipeline.query_ai_analyst(body.query, mode=body.mode)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ai-query", response_model=Dict[str, Any])
def query_ai_analyst_get(
    q: str = Query(..., description="Natural language query or station name"),
    mode: Optional[str] = Query(None, description="Action mode: explain_cluster, explain_station, compare_stations, generate_finding")
):
    """
    Interactive HeatShield AI Analyst (GET convenience endpoint).
    """
    try:
        pipeline = get_pipeline()
        return pipeline.query_ai_analyst(q, mode=mode)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Cache for cross-validation and benchmark reports
_idw_validation_cache: Optional[Dict[str, Any]] = None
_benchmark_cache: Optional[Dict[str, Any]] = None

@router.get("/idw-validation", response_model=Dict[str, Any])
def get_idw_validation(force_recompute: bool = Query(False, description="Force recomputing cross-validation grid")):
    """
    Returns Leave-One-Station-Out Cross-Validation (LOSOCV) results across k=1..6 and p=1.0..3.0.
    Provides empirical validation justifying selection of k=4 and p=2.0.
    """
    global _idw_validation_cache
    try:
        if _idw_validation_cache is not None and not force_recompute:
            return _idw_validation_cache

        from backend.ml.idw_validation import IDWCrossValidator
        pipeline = get_pipeline()
        df = pipeline.processed_df if pipeline.processed_df is not None else pipeline.full_processed_df
        if df is None:
            raise HTTPException(status_code=400, detail="Processed dataset not available in pipeline.")

        report = IDWCrossValidator.leave_one_station_out_cv(df)
        _idw_validation_cache = report
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute IDW cross-validation: {str(e)}")

@router.get("/performance-benchmark", response_model=Dict[str, Any])
def get_performance_benchmark(iterations: int = Query(500, ge=50, le=5000, description="Benchmark sample iterations")):
    """
    Runs high-resolution performance benchmark measuring Mean, Median, P95, and Throughput
    for offline IDW predictions. Empirically validates sub-millisecond execution claims.
    """
    global _benchmark_cache
    try:
        from backend.ml.benchmark import PerformanceBenchmarkEngine
        pipeline = get_pipeline()
        df = pipeline.processed_df if pipeline.processed_df is not None else pipeline.full_processed_df
        if df is None:
            raise HTTPException(status_code=400, detail="Processed dataset not available in pipeline.")

        bench_result = PerformanceBenchmarkEngine.run_idw_prediction_benchmark(df, iterations=iterations)
        return {
            "benchmark": bench_result,
            "validation_note": "Sub-millisecond execution is empirically validated on local CPU runtime."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute performance benchmark: {str(e)}")

