"""
Dataset API Routes
Provides endpoints for inspecting NOAA GSOD observations, station catalog, and data preview.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, List
from backend.ml.pipeline import get_pipeline

router = APIRouter(prefix="/api/dataset", tags=["Dataset"])

@router.get("/summary", response_model=Dict[str, Any])
def get_dataset_summary():
    """
    Returns high-level summary statistics of the loaded NOAA GSOD dataset.
    """
    try:
        pipeline = get_pipeline()
        return pipeline.get_dataset_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/preview", response_model=List[Dict[str, Any]])
def get_dataset_preview(limit: int = Query(50, ge=5, le=500)):
    """
    Returns preview rows from the preprocessed meteorological dataset.
    """
    try:
        pipeline = get_pipeline()
        if pipeline.processed_df is None:
            raise HTTPException(status_code=400, detail="Pipeline not initialized.")
            
        preview_cols = [
            "STATION", "NAME", "LATITUDE", "LONGITUDE", "DATE",
            "mean_temp_c", "max_temp_c", "min_temp_c", "temperature_range",
            "dew_point_c", "relative_humidity", "heat_index_c",
            "wind_speed_kmh", "pressure_hpa", "cluster"
        ]
        available_cols = [c for c in preview_cols if c in pipeline.processed_df.columns]
        subset = pipeline.processed_df[available_cols].head(limit)
        return subset.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/quality", response_model=Dict[str, Any])
def get_data_quality_metrics():
    """
    Returns scientific data quality audit statistics:
    Records, Stations, Missing flag percentage, Outlier records, and Data Quality Score.
    """
    try:
        pipeline = get_pipeline()
        return pipeline.data_quality_metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/coverage", response_model=Dict[str, Any])
def get_coverage_metrics():
    """
    Returns multi-year station observation coverage breakdown across 2022-2025.
    """
    try:
        pipeline = get_pipeline()
        return pipeline.get_coverage_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
