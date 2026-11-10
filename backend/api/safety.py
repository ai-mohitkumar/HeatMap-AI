"""
HeatShield Public Safety API Routes
Provides citizen heat risk assessments, personalized persona guidance,
nearby cooling centers & hydration points, and community assistance SOS networking.
"""

from fastapi import APIRouter, HTTPException, Path, Query
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import logging
import math
from datetime import datetime, timezone

from backend.ml.pipeline import get_pipeline
from backend.ml.safety_engine import HeatSafetyEngine
from backend.ml.physics import compute_heat_index_c, classify_heat_index_tier, compute_live_hsi

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/safety", tags=["Public Safety"])

class CreateCommunityRequest(BaseModel):
    station_id: str = Field(default="42182099999", description="Station ID or closest city")
    location_name: str = Field(..., description="Neighborhood or area name")
    beneficiary_type: str = Field(default="elderly", description="elderly, child, outdoor_worker, delivery_worker, construction_worker, athlete, no_cooling")
    urgency: str = Field(default="high", description="low, medium, high, extreme")
    title: str = Field(..., description="Short summary of requested assistance")
    description: str = Field(..., description="Detailed description of heat assistance need")
    contact_name: str = Field(default="Community Member", description="Contact person or organizer")
    distance_km: float = Field(default=1.0, description="Approximate distance")

@router.get("/risk-assessment/{station_id}", response_model=Dict[str, Any])
def get_safety_risk_assessment(
    station_id: str = Path(..., description="NOAA station ID")
):
    """
    Returns the comprehensive citizen Heat Safety Score (0-100), 5-tier classification,
    plain-language thermodynamic explanation, peak danger window, and persona advice.
    """
    pipeline = get_pipeline()
    df = pipeline.processed_df
    if df is None or len(df) == 0:
        raise HTTPException(status_code=503, detail="ML Pipeline data not initialized.")

    match = df[df["STATION"].astype(str) == str(station_id)]
    if len(match) == 0:
        # Fallback to first station if ID is unknown
        station_rec = df.iloc[0].to_dict()
    else:
        # Take latest or representative aggregated station record
        station_rec = match.iloc[-1].to_dict()

    return HeatSafetyEngine.get_citizen_risk_assessment(station_rec)

@router.get("/cooling-centers/{station_id}", response_model=List[Dict[str, Any]])
def get_cooling_centers(
    station_id: str = Path(..., description="NOAA station ID")
):
    """
    Returns verified municipal cooling shelters, air-conditioned public facilities,
    and drinking water kiosks for a specific station.
    """
    return HeatSafetyEngine.get_cooling_centers_for_station(str(station_id))

@router.get("/community-requests", response_model=List[Dict[str, Any]])
def get_community_requests(
    station_id: Optional[str] = Query(None, description="Optional station ID filter")
):
    """
    Returns active community heat assistance requests.
    """
    return HeatSafetyEngine.get_community_requests(station_id)

@router.post("/community-requests", response_model=Dict[str, Any])
def create_community_request(payload: CreateCommunityRequest):
    """
    Submits a new citizen or neighborhood heat assistance request.
    """
    return HeatSafetyEngine.add_community_request(payload.model_dump())

@router.post("/community-requests/{request_id}/respond", response_model=Dict[str, Any])
def respond_to_community_request(
    request_id: str = Path(..., description="Request ID to offer help for")
):
    """
    Signs up as a community volunteer to fulfill an active heat assistance request.
    """
    updated = HeatSafetyEngine.respond_to_request(request_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Assistance request not found.")
    return updated

class ActivityEvaluationRequest(BaseModel):
    station_id: str = Field(default="42182099999", description="Station ID")
    activity: str = Field(default="Running", description="e.g. Running, Walking, Gym, Commute, Cricket")
    planned_hour: int = Field(default=14, ge=0, le=23, description="24-hour format (e.g. 14 for 2 PM)")
    duration_mins: int = Field(default=45, description="Duration in minutes")

class SymptomCheckRequest(BaseModel):
    symptoms: List[str] = Field(default_factory=list, description="List of symptoms")

class FamilyMemberInput(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., description="Family member name")
    relationship: str = Field(..., description="e.g. Dad, Grandma, Sister")
    station_id: str = Field(..., description="Station ID of their location")
    phone_number: Optional[str] = Field(default=None, description="Contact phone number")

class FamilyStatusRequest(BaseModel):
    family_members: List[FamilyMemberInput]

class AssistantChatRequest(BaseModel):
    station_id: str = Field(default="42182099999", description="Current station ID")
    query: str = Field(..., description="User question")

@router.get("/daily-brief/{station_id}", response_model=Dict[str, Any])
def get_daily_heat_brief(
    station_id: str = Path(..., description="NOAA station ID")
):
    """
    Returns the morning 'Daily Heat Brief' specifically focusing on heat danger and timing.
    """
    pipeline = get_pipeline()
    df = pipeline.processed_df
    if df is None or len(df) == 0:
        raise HTTPException(status_code=503, detail="ML Pipeline data not initialized.")

    match = df[df["STATION"].astype(str) == str(station_id)]
    station_rec = match.iloc[-1].to_dict() if len(match) > 0 else df.iloc[0].to_dict()
    return HeatSafetyEngine.generate_daily_heat_brief(station_rec)

@router.post("/evaluate-activity", response_model=Dict[str, Any])
def evaluate_activity(payload: ActivityEvaluationRequest):
    """
    AI Schedule Negotiator: evaluates heat hazard for a planned activity and suggests safer times.
    """
    pipeline = get_pipeline()
    df = pipeline.processed_df
    if df is None or len(df) == 0:
        raise HTTPException(status_code=503, detail="ML Pipeline data not initialized.")

    match = df[df["STATION"].astype(str) == str(payload.station_id)]
    station_rec = match.iloc[-1].to_dict() if len(match) > 0 else df.iloc[0].to_dict()

    return HeatSafetyEngine.evaluate_activity_schedule(
        station_record=station_rec,
        activity=payload.activity,
        planned_hour=payload.planned_hour,
        duration_mins=payload.duration_mins
    )

@router.post("/symptom-check", response_model=Dict[str, Any])
def check_symptoms(payload: SymptomCheckRequest):
    """
    Evaluates citizen-reported symptoms and provides triage instructions.
    """
    return HeatSafetyEngine.triage_symptoms(payload.symptoms)

@router.post("/family-status", response_model=List[Dict[str, Any]])
def get_family_status(payload: FamilyStatusRequest):
    """
    Returns live heat safety risk status for family members across multiple cities.
    """
    pipeline = get_pipeline()
    df = pipeline.processed_df
    members_dicts = [m.model_dump() for m in payload.family_members]
    return HeatSafetyEngine.get_family_heat_status(members_dicts, df)

@router.post("/assistant-chat", response_model=Dict[str, Any])
def assistant_chat(payload: AssistantChatRequest):
    """
    AI Heat Assistant conversational answering grounded in actual biometeorological data.
    """
    pipeline = get_pipeline()
    df = pipeline.processed_df
    if df is None or len(df) == 0:
        raise HTTPException(status_code=503, detail="ML Pipeline data not initialized.")

    match = df[df["STATION"].astype(str) == str(payload.station_id)]
    station_rec = match.iloc[-1].to_dict() if len(match) > 0 else df.iloc[0].to_dict()

    return HeatSafetyEngine.query_heat_assistant(payload.query, station_rec, df)

@router.get("/localization", response_model=Dict[str, Any])
def get_localization():
    """
    Returns multilingual dictionary for English, Hindi (हिन्दी), and Punjabi (ਪੰਜਾਬੀ).
    """
    return HeatSafetyEngine.get_localization_dictionary()

class NearestStationRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="User latitude")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="User longitude")

@router.post("/nearest-station", response_model=Dict[str, Any])
def find_nearest_station(payload: NearestStationRequest):
    """
    Finds the closest NOAA station based on user's live GPS coordinates using Haversine geodesic distance.
    Returns nearest station info, distance in km, and real-time risk assessment.
    """
    pipeline = get_pipeline()
    df = pipeline.processed_df
    if df is None or len(df) == 0:
        raise HTTPException(status_code=503, detail="ML Pipeline data not initialized.")

    return HeatSafetyEngine.find_nearest_station(payload.latitude, payload.longitude, df)

@router.get("/live-all-stations", response_model=Dict[str, Any])
def get_live_all_stations():
    """
    Returns real-time heat status, temperature, heat index, and cluster vulnerability predictions
    for all 46 monitored stations.
    """
    pipeline = get_pipeline()
    df = pipeline.processed_df
    if df is None or len(df) == 0:
        raise HTTPException(status_code=503, detail="ML Pipeline data not initialized.")

    return HeatSafetyEngine.get_all_stations_live_status(df, pipeline.profiles)


class LocationPredictionRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Exact user latitude")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Exact user longitude")
    accuracy_m: Optional[float] = Field(None, description="Coordinate accuracy in meters (if available)")
    mode: Optional[str] = Field("online", description="'online' or 'offline'")
    location_source: Optional[str] = Field("GPS", description="Acquisition source e.g. hardware_gps, network_cellular, ip_geolocation, manual")


@router.post("/predict-location", response_model=Dict[str, Any])
@router.post("/predict/location", response_model=Dict[str, Any])
def predict_location_heat_risk(payload: LocationPredictionRequest):
    """
    Location-Aware Heat-Risk Prediction via Verified Device Coordinates & Multi-Station IDW Baseline.
    Uses live atmospheric observations in online mode while preserving NOAA GSOD stations as research baseline,
    or runs 100% on local GSOD dataset in offline mode.
    """
    pipeline = get_pipeline()
    df = pipeline.processed_df
    if df is None or len(df) == 0:
        raise HTTPException(status_code=503, detail="ML Pipeline data not initialized.")

    return HeatSafetyEngine.predict_location_heat_risk(
        user_lat=payload.latitude,
        user_lon=payload.longitude,
        df=df,
        accuracy_m=payload.accuracy_m,
        mode=payload.mode or "online",
        k=4,
        p=2.0,
        profiles_list=pipeline.profiles,
        location_source=payload.location_source or "GPS"
    )


@router.get("/weather/live", response_model=Dict[str, Any])
def get_live_weather(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="User Latitude"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="User Longitude")
):
    """
    Fetches real-time atmospheric observations from Open-Meteo's free weather API
    for any coordinates, computes Rothfusz Heat Index & Heat Stress Index (HSI),
    with explicitly tagged fallback to local NOAA GSOD IDW baseline if unreachable.
    """
    import urllib.request
    import json

    pipeline = get_pipeline()
    df = pipeline.processed_df
    fallback_reason: Optional[str] = None

    # 1. Attempt live query to Open-Meteo with local timezone
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={latitude}&longitude={longitude}&"
            f"current=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,surface_pressure,wind_speed_10m&"
            f"daily=temperature_2m_max&forecast_days=1&timezone=auto"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "HeatShieldAI/1.0"})
        with urllib.request.urlopen(req, timeout=3.5) as resp:
            if resp.status == 200:
                payload = json.loads(resp.read().decode())
                live = payload.get("current", {})
                if live.get("temperature_2m") is not None:
                    t = float(live["temperature_2m"])
                    rh = float(live["relative_humidity_2m"]) if live.get("relative_humidity_2m") is not None else 50.0
                    dewp = float(live["dew_point_2m"]) if live.get("dew_point_2m") is not None else 18.0
                    wind = float(live["wind_speed_10m"]) if live.get("wind_speed_10m") is not None else 10.0
                    pres = float(live["surface_pressure"]) if live.get("surface_pressure") is not None else 1010.0
                    apparent_t = float(live["apparent_temperature"]) if live.get("apparent_temperature") is not None else t
                    daily_max_list = payload.get("daily", {}).get("temperature_2m_max", [])
                    daily_max = max(t, float(daily_max_list[0])) if daily_max_list and daily_max_list[0] is not None else t

                    heat_index_c = compute_heat_index_c(t, rh)
                    score = compute_live_hsi(t, heat_index_c, daily_max, wind)
                    tier = classify_heat_index_tier(heat_index_c)

                    return {
                        "source": "Open-Meteo Live API",
                        "source_type": "live_observation",
                        "provider": "Open-Meteo",
                        "status": "online",
                        "latitude": latitude,
                        "longitude": longitude,
                        "temperature_c": round(t, 1),
                        "relative_humidity_pct": round(rh, 1),
                        "dew_point_c": round(dewp, 1),
                        "wind_speed_kmh": round(wind, 1),
                        "surface_pressure_hpa": round(pres, 1),
                        "apparent_temperature_c": round(apparent_t, 1),
                        "heat_index_c": heat_index_c,
                        "heat_stress_index": score,
                        "risk_tier": tier,
                        "is_live": True,
                        "observed_at": live.get("time"),
                        "timezone": payload.get("timezone"),
                        "utc_offset_seconds": payload.get("utc_offset_seconds"),
                        "fallback_reason": None
                    }
                fallback_reason = "Open-Meteo response missing current.temperature_2m"
                logger.warning("Open-Meteo live weather missing temperature_2m for (%.4f, %.4f)", latitude, longitude)
            else:
                fallback_reason = f"Open-Meteo returned HTTP {resp.status}"
                logger.warning("Open-Meteo live weather HTTP %s for (%.4f, %.4f)", resp.status, latitude, longitude)
    except Exception as exc:
        fallback_reason = str(exc)
        logger.warning("Open-Meteo live weather failed for (%.4f, %.4f): %s", latitude, longitude, exc)

    # 2. Offline / fallback using HeatSafetyEngine IDW over GSOD stations
    if df is None or len(df) == 0:
        raise HTTPException(status_code=503, detail="ML Pipeline data not initialized.")

    fallback = HeatSafetyEngine.predict_location_heat_risk(
        user_lat=latitude,
        user_lon=longitude,
        df=df,
        mode="offline",
        k=4,
        p=2.0
    )
    weather = fallback.get("weather", {})
    pred = fallback.get("prediction", {})
    fb_temp = float(weather.get("temperature", 32.0))
    fb_rh = float(weather.get("humidity", 50.0))
    fb_hi = float(weather.get("feels_like", compute_heat_index_c(fb_temp, fb_rh)))
    fb_tier = classify_heat_index_tier(fb_hi)

    return {
        "source": "Local NOAA GSOD 2022–2025 Multi-Station IDW (Offline Estimate)",
        "source_type": "offline_estimate",
        "provider": "NOAA GSOD IDW",
        "status": "offline_fallback",
        "latitude": latitude,
        "longitude": longitude,
        "temperature_c": fb_temp,
        "relative_humidity_pct": fb_rh,
        "dew_point_c": float(weather.get("dew_point", 18.0)),
        "wind_speed_kmh": float(weather.get("wind_speed", 10.0)),
        "surface_pressure_hpa": float(weather.get("pressure", 1010.0)),
        "apparent_temperature_c": fb_hi,
        "heat_index_c": fb_hi,
        "heat_stress_index": int(pred.get("risk_score", 45)),
        "risk_tier": fb_tier,
        "is_live": False,
        "observed_at": None,
        "estimated_at": datetime.now(timezone.utc).isoformat(),
        "fallback_reason": fallback_reason or "Live weather provider unavailable"
    }


class WelfareCheckinRequest(BaseModel):
    user_name: Optional[str] = Field("Citizen", description="User's display name")
    location_name: str = Field(..., description="Village / District / City name")
    latitude: float = Field(..., description="GPS Latitude")
    longitude: float = Field(..., description="GPS Longitude")
    water_liters: float = Field(default=1.5, description="Liters of water ingested today")
    status_note: Optional[str] = Field("Safe and hydrated", description="User note or status")
    risk_tier: Optional[str] = Field("Low", description="Current heat tier at checkin")


@router.get("/forecast/hourly", response_model=Dict[str, Any])
def get_hourly_heat_forecast(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Longitude"),
    station_id: Optional[str] = Query(None, description="Optional closest station ID")
):
    """
    Returns 15 daylight hourly predictions (06:00 to 20:00) with diurnal heating curve,
    humidity shifts, Rothfusz Heat Index, and peak risk window calculation.
    Queries Open-Meteo live hourly forecast when available, falling back to diurnal modeling.
    """
    pipeline = get_pipeline()
    df = pipeline.processed_df
    if df is None or len(df) == 0:
        raise HTTPException(status_code=503, detail="ML Pipeline data not initialized.")

    if station_id and str(station_id) in df["STATION"].astype(str).values:
        match = df[df["STATION"].astype(str) == str(station_id)]
        station_rec = match.iloc[-1].to_dict()
    else:
        nearest = HeatSafetyEngine.find_nearest_station(latitude, longitude, df)
        st_id = nearest.get("nearest_station_id")
        match = df[df["STATION"].astype(str) == str(st_id)]
        station_rec = match.iloc[-1].to_dict() if len(match) > 0 else df.iloc[0].to_dict()

    base_temp = float(station_rec.get("TEMP", 32.0))
    max_temp = float(station_rec.get("MAX", base_temp + 5.5))
    min_temp = float(station_rec.get("MIN", base_temp - 6.0))
    base_rh = float(station_rec.get("RH", 55.0))

    # Attempt to query live Open-Meteo hourly forecast in location's local timezone
    live_hourly_map = {}
    data_source_mode = "diurnal_solar_physics"
    om_timezone: Optional[str] = None
    fallback_reason: Optional[str] = None
    try:
        import urllib.request
        import json
        om_url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={latitude}&longitude={longitude}&"
            f"hourly=temperature_2m,relative_humidity_2m&forecast_days=1&timezone=auto"
        )
        req = urllib.request.Request(om_url, headers={"User-Agent": "HeatShieldAI/1.0"})
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            if resp.status == 200:
                payload = json.loads(resp.read().decode())
                om_timezone = payload.get("timezone")
                times = payload.get("hourly", {}).get("time", [])
                temps = payload.get("hourly", {}).get("temperature_2m", [])
                rhs = payload.get("hourly", {}).get("relative_humidity_2m", [])
                for t_str, t_val, rh_val in zip(times, temps, rhs):
                    if "T" in t_str and t_val is not None:
                        hour_int = int(t_str.split("T")[1].split(":")[0])
                        live_hourly_map[hour_int] = (float(t_val), float(rh_val if rh_val is not None else base_rh))
                if live_hourly_map:
                    data_source_mode = "open_meteo_live_forecast"
                else:
                    fallback_reason = "Open-Meteo hourly response contained no usable points"
                    logger.warning("Open-Meteo hourly response empty for (%.4f, %.4f)", latitude, longitude)
            else:
                fallback_reason = f"Open-Meteo hourly returned HTTP {resp.status}"
                logger.warning("Open-Meteo hourly HTTP %s for (%.4f, %.4f)", resp.status, latitude, longitude)
    except Exception as exc:
        fallback_reason = str(exc)
        logger.warning("Open-Meteo hourly forecast failed for (%.4f, %.4f): %s", latitude, longitude, exc)

    hours_list = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    hourly = []
    peak_hi = -999.0
    peak_h = 14

    for h in hours_list:
        solar_factor = math.sin(max(0.0, min(math.pi, ((h - 6) / 9.5) * (math.pi / 2.0))))
        if h in live_hourly_map:
            cur_temp, cur_rh = live_hourly_map[h]
        else:
            cur_temp = round(min_temp + (max_temp - min_temp) * (solar_factor ** 1.2), 1)
            cur_rh = round(max(15.0, min(95.0, base_rh - (solar_factor * 22.0))), 1)

        heat_index_c = compute_heat_index_c(cur_temp, cur_rh)
        tier = classify_heat_index_tier(heat_index_c)

        if tier == "Low":
            advice = "Coolest part of the day. Ideal for outdoor chores."
        elif tier == "Moderate":
            advice = "Drink 250ml water per hour; light shade advised."
        elif tier == "High":
            advice = "Laborers take 15-min rest in shade per hour."
        elif tier == "Very High":
            advice = "Danger of heat cramps & exhaustion. Avoid direct sun."
        else:
            advice = "Extreme heatstroke danger. Halt outdoor exertion."

        if heat_index_c > peak_hi:
            peak_hi = heat_index_c
            peak_h = h

        hourly.append({
            "hour": f"{h:02d}:00",
            "hour_num": h,
            "temp_c": cur_temp,
            "heat_index_c": heat_index_c,
            "humidity_pct": cur_rh,
            "risk_tier": tier,
            "is_peak": False,
            "uv_index": max(1, min(11, round(solar_factor * 10))),
            "advice": advice
        })

    for item in hourly:
        if item["hour_num"] in (peak_h, peak_h + 1):
            item["is_peak"] = True

    start_str = f"{peak_h - 12}:00 PM" if peak_h > 12 else f"{peak_h}:00 AM"
    end_h = peak_h + 2
    end_str = f"{end_h - 12}:00 PM" if end_h > 12 else f"{end_h}:00 AM"

    peak_tier = classify_heat_index_tier(peak_hi)
    is_live_forecast = data_source_mode == "open_meteo_live_forecast"

    return {
        "station_id": str(station_rec.get("STATION", "UNKNOWN")),
        "station_name": str(station_rec.get("NAME", "Regional Station")),
        "latitude": latitude,
        "longitude": longitude,
        "data_source": data_source_mode,
        "source_type": "forecast" if is_live_forecast else "offline_estimate",
        "provider": "Open-Meteo Forecast API" if is_live_forecast else "NOAA GSOD Diurnal Model",
        "is_live": is_live_forecast,
        "timezone": om_timezone,
        "fallback_reason": None if is_live_forecast else (fallback_reason or "Forecast provider unavailable"),
        "peak_window": f"{start_str} – {end_str}",
        "peak_heat_index_c": peak_hi,
        "peak_tier": peak_tier,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "hourly": hourly
    }


@router.post("/welfare-checkin", response_model=Dict[str, Any])
def submit_welfare_checkin(payload: WelfareCheckinRequest):
    """
    Records an 'I'm Safe Today' check-in beacon from a citizen or vulnerable family member.
    """
    now = datetime.now()
    formatted = now.strftime("%I:%M %p")
    return {
        "success": True,
        "message": f"Welfare check-in recorded for {payload.location_name} at {formatted}",
        "record": {
            "timestamp": now.isoformat(),
            "time_formatted": formatted,
            "user_name": payload.user_name,
            "location_name": payload.location_name,
            "lat": payload.latitude,
            "lon": payload.longitude,
            "water_liters": payload.water_liters,
            "status_note": payload.status_note,
            "risk_tier": payload.risk_tier
        }
    }



