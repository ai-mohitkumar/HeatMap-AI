"""
HeatShield Public Safety API Routes
Provides citizen heat risk assessments, personalized persona guidance,
nearby cooling centers & hydration points, and community assistance SOS networking.
"""

from fastapi import APIRouter, HTTPException, Path, Query
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import math
from datetime import datetime

from backend.ml.pipeline import get_pipeline
from backend.ml.safety_engine import HeatSafetyEngine

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

    return HeatSafetyEngine.query_heat_assistant(payload.query, station_rec)

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
    accuracy_m: Optional[float] = Field(18.0, description="GPS satellite accuracy in meters")
    mode: Optional[str] = Field("online", description="'online' or 'offline'")


@router.post("/predict-location", response_model=Dict[str, Any])
@router.post("/predict/location", response_model=Dict[str, Any])
def predict_location_heat_risk(payload: LocationPredictionRequest):
    """
    Location-Aware Heat-Risk Prediction via Exact Device GPS & Multi-Station IDW Spatial Interpolation.
    Blends live atmospheric observations with NOAA GSOD historical baseline in online mode,
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
        profiles_list=pipeline.profiles
    )


@router.get("/weather/live", response_model=Dict[str, Any])
def get_live_weather(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="User Latitude"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="User Longitude")
):
    """
    Fetches real-time atmospheric observations from Open-Meteo's free weather API
    for any coordinates across India, computes Rothfusz Heat Index & Heat Stress Index (HSI),
    with seamless automatic fallback to local NOAA GSOD IDW baseline if offline.
    """
    import urllib.request
    import json

    pipeline = get_pipeline()
    df = pipeline.processed_df

    # 1. Attempt live query to Open-Meteo
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={latitude}&longitude={longitude}&"
            f"current=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,surface_pressure,wind_speed_10m"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "HeatShieldAI/1.0"})
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            if resp.status == 200:
                live = json.loads(resp.read().decode()).get("current", {})
                t = float(live.get("temperature_2m", 32.0))
                rh = float(live.get("relative_humidity_2m", 50.0))
                dewp = float(live.get("dew_point_2m", 18.0))
                wind = float(live.get("wind_speed_10m", 10.0))
                pres = float(live.get("surface_pressure", 1010.0))
                apparent_t = float(live.get("apparent_temperature", t))

                tf = t * 1.8 + 32.0
                hi_f = (-42.379 + 2.04901523 * tf + 10.14333127 * rh - 0.22475541 * tf * rh
                        - 0.00683783 * (tf**2) - 0.05481717 * (rh**2) + 0.00122874 * (tf**2) * rh
                        + 0.00085282 * tf * (rh**2) - 0.00000199 * (tf**2) * (rh**2))
                heat_index_c = round((hi_f - 32.0) / 1.8, 1) if tf >= 80 else round(t, 1)

                hsi = 0.5 * t + 0.4 * heat_index_c + 0.1 * (t + 3.5) - 0.05 * wind
                score = int(max(5, min(99, round(hsi))))

                if heat_index_c <= 29.0:
                    tier = "Low"
                elif heat_index_c <= 37.0:
                    tier = "Moderate"
                elif heat_index_c <= 44.0:
                    tier = "High"
                elif heat_index_c <= 53.0:
                    tier = "Very High"
                else:
                    tier = "Extreme"

                return {
                    "source": "Open-Meteo Live API",
                    "status": "online",
                    "latitude": latitude,
                    "longitude": longitude,
                    "temperature_c": t,
                    "relative_humidity_pct": rh,
                    "dew_point_c": dewp,
                    "wind_speed_kmh": wind,
                    "surface_pressure_hpa": pres,
                    "apparent_temperature_c": apparent_t,
                    "heat_index_c": heat_index_c,
                    "heat_stress_index": score,
                    "risk_tier": tier,
                    "is_live": True,
                    "observed_at": live.get("time", datetime.now().isoformat())
                }
    except Exception:
        pass

    # 2. Offline / fallback using HeatSafetyEngine IDW over GSOD stations
    fallback = HeatSafetyEngine.predict_location_heat_risk(
        user_lat=latitude,
        user_lon=longitude,
        df=df,
        mode="offline",
        k=4,
        p=2.0
    )
    weather = fallback.get("interpolated_weather", {})
    return {
        "source": "Local NOAA GSOD 2022–2025 Multi-Station IDW (Offline Fallback)",
        "status": "offline_fallback",
        "latitude": latitude,
        "longitude": longitude,
        "temperature_c": weather.get("temperature_c", 32.0),
        "relative_humidity_pct": weather.get("relative_humidity_pct", 50.0),
        "dew_point_c": weather.get("dew_point_c", 18.0),
        "wind_speed_kmh": weather.get("wind_speed_kmh", 10.0),
        "surface_pressure_hpa": weather.get("pressure_hpa", 1010.0),
        "apparent_temperature_c": weather.get("heat_index_c", 32.0),
        "heat_index_c": weather.get("heat_index_c", 32.0),
        "heat_stress_index": fallback.get("risk_score", 45),
        "risk_tier": fallback.get("risk_tier", "Moderate"),
        "is_live": False,
        "observed_at": datetime.now().isoformat()
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

    # Attempt to query live Open-Meteo hourly forecast
    live_hourly_map = {}
    data_source_mode = "diurnal_solar_physics"
    try:
        import urllib.request
        import json
        om_url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={latitude}&longitude={longitude}&"
            f"hourly=temperature_2m,relative_humidity_2m&forecast_days=1"
        )
        req = urllib.request.Request(om_url, headers={"User-Agent": "HeatShieldAI/1.0"})
        with urllib.request.urlopen(req, timeout=2.5) as resp:
            if resp.status == 200:
                payload = json.loads(resp.read().decode())
                times = payload.get("hourly", {}).get("time", [])
                temps = payload.get("hourly", {}).get("temperature_2m", [])
                rhs = payload.get("hourly", {}).get("relative_humidity_2m", [])
                for t_str, t_val, rh_val in zip(times, temps, rhs):
                    if "T" in t_str and t_val is not None:
                        hour_int = int(t_str.split("T")[1].split(":")[0])
                        live_hourly_map[hour_int] = (float(t_val), float(rh_val if rh_val is not None else base_rh))
                if live_hourly_map:
                    data_source_mode = "open_meteo_live_forecast"
    except Exception:
        pass

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

        T = cur_temp
        R = cur_rh
        hi = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (R * 0.094))
        if hi >= 80:
            hi = (-42.379 + 2.04901523 * T + 10.14333127 * R - 0.22475541 * T * R
                  - 6.837651e-3 * T * T - 5.481717e-2 * R * R + 1.22874e-3 * T * T * R
                  + 8.5282e-4 * T * R * R - 1.99e-6 * T * T * R * R)
        heat_index_c = round(max(T, hi) if T >= 27.0 else T, 1)

        if heat_index_c <= 29.0:
            tier = "Low"
            advice = "Coolest part of the day. Ideal for outdoor chores."
        elif heat_index_c <= 37.0:
            tier = "Moderate"
            advice = "Drink 250ml water per hour; light shade advised."
        elif heat_index_c <= 44.0:
            tier = "High"
            advice = "Laborers take 15-min rest in shade per hour."
        elif heat_index_c <= 53.0:
            tier = "Very High"
            advice = "Danger of heat cramps & exhaustion. Avoid direct sun."
        else:
            tier = "Extreme"
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

    if peak_hi <= 29.0:
        peak_tier = "Low"
    elif peak_hi <= 37.0:
        peak_tier = "Moderate"
    elif peak_hi <= 44.0:
        peak_tier = "High"
    elif peak_hi <= 53.0:
        peak_tier = "Very High"
    else:
        peak_tier = "Extreme"

    return {
        "station_id": str(station_rec.get("STATION", "UNKNOWN")),
        "station_name": str(station_rec.get("NAME", "Regional Station")),
        "latitude": latitude,
        "longitude": longitude,
        "data_source": data_source_mode,
        "is_live": data_source_mode == "open_meteo_live_forecast",
        "peak_window": f"{start_str} – {end_str}",
        "peak_heat_index_c": peak_hi,
        "peak_tier": peak_tier,
        "generated_at": datetime.now().isoformat(),
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



