"""
Temporal Analysis API Routes
Handles multi-year trend queries, annual cluster shifts, and station-by-station transition histories.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from backend.ml.pipeline import get_pipeline

router = APIRouter(prefix="/api/temporal", tags=["Temporal Analysis"])

@router.get("/annual-shifts", response_model=List[Dict[str, Any]])
def get_annual_cluster_shifts():
    """
    Returns annual cluster membership distribution (2022-2025) and mean HSI trends.
    """
    try:
        pipeline = get_pipeline()
        return pipeline.annual_temporal_shifts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/station-transitions/{station_id}", response_model=Dict[str, Any])
def get_station_transition_history(station_id: str):
    """
    Answers: "What Changed?"
    Returns the year-by-year trajectory (2022-2025) and detected profile transitions for a specific station.
    """
    try:
        pipeline = get_pipeline()
        return pipeline.get_station_transitions(station_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transition-matrix", response_model=List[Dict[str, Any]])
def get_multiyear_transition_matrix():
    """
    Returns complete multi-year vulnerability transition matrix across all 46 monitoring stations (2022–2025).
    """
    try:
        pipeline = get_pipeline()
        return pipeline.get_all_transition_matrix()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/set-year", response_model=Dict[str, Any])
def filter_by_year(year: Optional[int] = Query(None, description="Year to filter (2022-2025) or omit for all")):
    """
    Filters pipeline dataset to a specific summer heat season.
    """
    try:
        pipeline = get_pipeline()
        return pipeline.set_year_filter(year)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
