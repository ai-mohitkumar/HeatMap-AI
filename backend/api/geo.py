"""
HeatShield AI - Administrative Geography API (States, Districts & Villages)
Provides comprehensive geographic data, hierarchical lookups, universal fuzzy resolution,
and continuous spatial IDW heat evaluation across all 36 States/UTs, 780+ districts, and all villages.
"""

from fastapi import APIRouter, HTTPException, Query, Request
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import urllib.request
import json

from backend.data.geo_data import (
    get_all_states,
    get_districts_by_state,
    search_locations,
    resolve_universal_location,
    find_nearest_district,
    DISTRICTS_DATA
)
from backend.ml.pipeline import get_pipeline
from backend.ml.safety_engine import HeatSafetyEngine

router = APIRouter(prefix="/api/geo", tags=["Administrative Geography"])

@router.get("/ip", response_model=Dict[str, Any])
def get_ip_location(request: Request):
    """
    Returns estimated geolocation for the requesting client IP with automatic district resolution.
    """
    client_host = request.client.host if request.client else "127.0.0.1"
    # If localhost/internal, default to Patna, Bihar reference point
    if client_host in ("127.0.0.1", "localhost", "::1") or client_host.startswith("192.168.") or client_host.startswith("10."):
        return {
            "ip": client_host,
            "city": "Patna",
            "district": "Patna",
            "state": "Bihar",
            "latitude": 25.5941,
            "longitude": 85.1376,
            "country": "India",
            "is_default": True
        }
    try:
        forwarded = request.headers.get("x-forwarded-for")
        query_ip = forwarded.split(",")[0].strip() if forwarded else client_host
        req = urllib.request.Request(f"http://ip-api.com/json/{query_ip}", headers={"User-Agent": "HeatShield/2.0"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("status") == "success":
                lat = float(data.get("lat", 25.5941))
                lon = float(data.get("lon", 85.1376))
                nearest = find_nearest_district(lat, lon)
                return {
                    "ip": query_ip,
                    "city": nearest.get("district_name") or data.get("city", "Patna"),
                    "district": nearest.get("district_name", "Patna"),
                    "state": nearest.get("state_name", "Bihar"),
                    "latitude": lat,
                    "longitude": lon,
                    "country": data.get("country", "India"),
                    "is_default": False
                }
    except Exception:
        pass
    return {
        "ip": client_host,
        "city": "Patna",
        "district": "Patna",
        "state": "Bihar",
        "latitude": 25.5941,
        "longitude": 85.1376,
        "country": "India",
        "is_default": True
    }

class GeoEvaluateRequest(BaseModel):
    latitude: float = Field(..., description="Latitude of target village/district")
    longitude: float = Field(..., description="Longitude of target village/district")
    name: Optional[str] = Field(default="Target Location", description="Name of village or district")
    district_name: Optional[str] = None
    state_name: Optional[str] = None
    accuracy_m: float = Field(default=25.0, description="Estimated accuracy in meters")

@router.get("/states", response_model=List[Dict[str, Any]])
def list_states():
    """
    Returns all 36 States & Union Territories of India with centroids, capitals, and climate zones.
    """
    return get_all_states()

@router.get("/districts", response_model=List[Dict[str, Any]])
def list_districts(
    state: Optional[str] = Query(None, description="Optional filter by state name or state code (e.g. BR, Bihar)")
):
    """
    Returns districts of India. If state filter is provided, returns districts for that state.
    """
    if state:
        return get_districts_by_state(state)
    return DISTRICTS_DATA

@router.get("/villages", response_model=Dict[str, Any])
def list_villages(
    district: str = Query(..., description="District name (e.g. Patna, Jodhpur, Gaya, Varanasi)")
):
    """
    Returns sub-districts/tehsils and sample villages for a given district.
    """
    q = district.strip().lower()
    matched = None
    for d in DISTRICTS_DATA:
        if d["district_name"].lower() == q or d["district_id"].lower() == q:
            matched = d
            break

    if not matched:
        # Fallback to closest match
        for d in DISTRICTS_DATA:
            if q in d["district_name"].lower():
                matched = d
                break

    if not matched:
        raise HTTPException(status_code=404, detail=f"District '{district}' not found in registry.")

    return {
        "district_id": matched["district_id"],
        "district_name": matched["district_name"],
        "state_name": matched["state_name"],
        "state_code": matched["state_code"],
        "latitude": matched["latitude"],
        "longitude": matched["longitude"],
        "headquarters": matched["headquarters"],
        "climate_zone": matched["climate_zone"],
        "tehsils": matched.get("tehsils", []),
        "sample_villages": matched.get("sample_villages", [])
    }

@router.get("/search", response_model=List[Dict[str, Any]])
def search_geo(
    q: str = Query(..., description="Search query for any State, District, Tehsil, or Village in India"),
    limit: int = Query(10, ge=1, le=50, description="Max results")
):
    """
    Instant autocomplete search across all States, Districts, Tehsils, and Villages in India.
    """
    return search_locations(q, limit=limit)

@router.get("/resolve", response_model=Dict[str, Any])
def resolve_location(
    q: str = Query(..., description="Query to resolve (e.g. 'Maner', 'Phalodi', 'Bikram', 'Barmer')"),
    district: Optional[str] = Query(None, description="Optional parent district hint"),
    state: Optional[str] = Query(None, description="Optional parent state hint")
):
    """
    Universal location resolver. GUARANTEES resolution for ALL CASES.
    If an unindexed village is queried, gracefully derives coordinates within the district boundary.
    """
    return resolve_universal_location(query=q, district_hint=district, state_hint=state)

@router.get("/reverse", response_model=Dict[str, Any])
def reverse_geocode(
    lat: float = Query(..., ge=6.0, le=38.0, description="Latitude in India"),
    lon: float = Query(..., ge=68.0, le=98.0, description="Longitude in India")
):
    """
    Reverse geocodes any GPS coordinate in India to its nearest district and state.
    """
    return find_nearest_district(lat, lon)

@router.post("/evaluate", response_model=Dict[str, Any])
def evaluate_geo_location(payload: GeoEvaluateRequest):
    """
    Computes spatial IDW biometeorological evaluation for any resolved village or district in India.
    Returns: interpolated temperature, Heat Index, HSI risk score, 5-tier classification,
    4 contributing synoptic stations with weights, and tailored safety advice.
    """
    pipeline = get_pipeline()
    df = pipeline.processed_df
    if df is None or len(df) == 0:
        raise HTTPException(status_code=503, detail="ML Pipeline not initialized.")

    prediction = HeatSafetyEngine.predict_location_heat_risk(
        user_lat=payload.latitude,
        user_lon=payload.longitude,
        df=df,
        accuracy_m=payload.accuracy_m,
        mode="offline",
        k=4,
        p=2.0,
        profiles_list=pipeline.profiles
    )

    # Attach administrative context
    prediction["administrative"] = {
        "name": payload.name,
        "district_name": payload.district_name,
        "state_name": payload.state_name,
        "coordinates": f"{payload.latitude:.4f}° N, {payload.longitude:.4f}° E"
    }

    return prediction
