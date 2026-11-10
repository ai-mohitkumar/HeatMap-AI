"""
HeatShield AI - Administrative Geography API (States, Districts & Villages)
Provides comprehensive geographic data, hierarchical lookups, universal fuzzy resolution,
security-hardened IP geolocation (never trusting spoofed forwarded headers or defaulting localhost
to a hardcoded city), Nominatim reverse geocoding with Haversine centroid fallback, and spatial IDW evaluation.
"""

from fastapi import APIRouter, HTTPException, Query, Request
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field
import ipaddress
import json
import logging
import os
import time
import urllib.request

from backend.data.geo_data import (
    get_all_states,
    get_districts_by_state,
    search_locations,
    resolve_universal_location,
    find_nearest_district,
    find_district_by_name,
    _haversine_km,
    DISTRICTS_DATA
)
from backend.ml.pipeline import get_pipeline
from backend.ml.safety_engine import HeatSafetyEngine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/geo", tags=["Administrative Geography"])

_REVERSE_CACHE: Dict[Tuple[float, float], Tuple[float, Dict[str, Any]]] = {}
_REVERSE_CACHE_TTL_SEC = 3600.0
_REVERSE_CACHE_MAX_ENTRIES = 512


def _parse_trusted_proxies() -> List[ipaddress._BaseNetwork]:
    raw = os.environ.get("TRUSTED_PROXY_IPS", "")
    nets: List[ipaddress._BaseNetwork] = []
    for token in raw.split(","):
        token = token.strip()
        if not token:
            continue
        try:
            if "/" in token:
                nets.append(ipaddress.ip_network(token, strict=False))
            else:
                addr = ipaddress.ip_address(token)
                prefix = 32 if addr.version == 4 else 128
                nets.append(ipaddress.ip_network(f"{addr}/{prefix}", strict=False))
        except ValueError:
            logger.warning("Ignoring invalid TRUSTED_PROXY_IPS entry: %r", token)
    return nets


def _is_trusted_proxy(ip_str: str, trusted_nets: List[ipaddress._BaseNetwork]) -> bool:
    if not ip_str or not trusted_nets:
        return False
    try:
        addr = ipaddress.ip_address(ip_str.strip())
    except ValueError:
        return False
    return any(addr in net for net in trusted_nets)


def _extract_client_ip(request: Request) -> Tuple[str, bool]:
    """
    Extracts client IP safely. Forwarded headers are honored ONLY when the immediate
    socket peer is explicitly allowlisted in TRUSTED_PROXY_IPS.
    """
    peer_ip = (request.client.host if request.client and request.client.host else "").strip()
    trusted_nets = _parse_trusted_proxies()
    if _is_trusted_proxy(peer_ip, trusted_nets):
        xff = request.headers.get("x-forwarded-for")
        if xff:
            parts = [p.strip() for p in xff.split(",") if p.strip()]
            for candidate in reversed(parts):
                if not _is_trusted_proxy(candidate, trusted_nets):
                    return candidate, True
            if parts:
                return parts[0], True
        x_real_ip = request.headers.get("x-real-ip")
        if x_real_ip:
            return x_real_ip.strip(), True
    return peer_ip or "127.0.0.1", False


def _is_non_routable_ip(ip_str: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip_str.strip())
        return (
            not addr.is_global
            or addr.is_private
            or addr.is_loopback
            or addr.is_link_local
            or addr.is_reserved
            or addr.is_multicast
            or addr.is_unspecified
        )
    except ValueError:
        return True


def _unavailable_ip_response(ip_str: str, reason: str, used_forwarded_header: bool = False) -> Dict[str, Any]:
    return {
        "status": "unavailable",
        "ip": ip_str,
        "city": None,
        "district": None,
        "state": None,
        "country": None,
        "latitude": None,
        "longitude": None,
        "accuracy_m": None,
        "location_source": "unavailable",
        "used_forwarded_header": used_forwarded_header,
        "is_default": False,
        "reason": reason
    }


def _fetch_public_ip_geo(query_ip: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """Queries HTTPS IP geolocation providers, returning normalized geo metadata or error reason."""
    providers = [
        (
            "ipwho.is",
            f"https://ipwho.is/{query_ip}",
            lambda d: d.get("success") is True and d.get("latitude") is not None and d.get("longitude") is not None,
            lambda d: (
                float(d["latitude"]),
                float(d["longitude"]),
                d.get("city"),
                d.get("region"),
                d.get("country"),
            ),
        ),
        (
            "freeipapi.com",
            f"https://free.freeipapi.com/api/v1/json/{query_ip}",
            lambda d: d.get("latitude") is not None and d.get("longitude") is not None,
            lambda d: (
                float(d["latitude"]),
                float(d["longitude"]),
                d.get("cityName"),
                d.get("regionName"),
                d.get("countryName"),
            ),
        ),
        (
            "geojs.io",
            f"https://get.geojs.io/v1/ip/geo/{query_ip}.json",
            lambda d: d.get("latitude") is not None and d.get("longitude") is not None,
            lambda d: (
                float(d["latitude"]),
                float(d["longitude"]),
                d.get("city"),
                d.get("region"),
                d.get("country"),
            ),
        ),
    ]

    last_error = "No IP geolocation provider succeeded"
    for name, url, is_valid, extract in providers:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "HeatShieldAI/2.0"})
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                if resp.status != 200:
                    last_error = f"{name} returned HTTP {resp.status}"
                    logger.warning("IP geolocation %s HTTP %s for IP %s", name, resp.status, query_ip)
                    continue
                data = json.loads(resp.read().decode("utf-8"))
                if not is_valid(data):
                    last_error = f"{name} returned invalid/empty response"
                    logger.warning("IP geolocation %s invalid payload for IP %s: %s", name, query_ip, data.get("message"))
                    continue
                lat, lon, city, region, country = extract(data)
                return {
                    "provider": name,
                    "latitude": lat,
                    "longitude": lon,
                    "city": city,
                    "region": region,
                    "country": country,
                }, None
        except Exception as exc:
            last_error = f"{name}: {exc}"
            logger.warning("IP geolocation %s error for IP %s: %s", name, query_ip, exc)

    return None, last_error


@router.get("/ip", response_model=Dict[str, Any])
def get_ip_location(request: Request):
    """
    Returns estimated geolocation for the requesting public client IP.
    Never returns a hardcoded default city on localhost, private networks, or lookup failure.
    """
    query_ip, used_forwarded = _extract_client_ip(request)
    if _is_non_routable_ip(query_ip):
        return _unavailable_ip_response(
            query_ip,
            "Client IP is loopback, private, or non-routable; physical location must be acquired via GPS or manual selection.",
            used_forwarded_header=used_forwarded,
        )

    geo_data, err_reason = _fetch_public_ip_geo(query_ip)
    if not geo_data:
        return _unavailable_ip_response(
            query_ip,
            f"Public IP geolocation failed ({err_reason}); manual selection required.",
            used_forwarded_header=used_forwarded,
        )

    lat = float(geo_data["latitude"])
    lon = float(geo_data["longitude"])
    in_india = 6.0 <= lat <= 38.0 and 68.0 <= lon <= 98.0
    nearest = find_nearest_district(lat, lon) if in_india else None

    provider_city = geo_data.get("city")
    provider_region = geo_data.get("region")
    return {
        "status": "resolved",
        "ip": query_ip,
        "city": provider_city or (nearest["district"]["district_name"] if nearest else None),
        "district": nearest["district"]["district_name"] if nearest else provider_city,
        "nearest_district_hint": nearest["district"]["district_name"] if nearest else None,
        "nearest_district_distance_km": nearest["distance_km"] if nearest else None,
        "state": provider_region or (nearest["state"] if nearest else None),
        "country": geo_data.get("country") or ("India" if in_india else None),
        "latitude": round(lat, 4),
        "longitude": round(lon, 4),
        "accuracy_m": 15000,
        "location_source": "ip_geolocation",
        "provider": geo_data.get("provider"),
        "used_forwarded_header": used_forwarded,
        "is_default": False
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

def _query_nominatim_reverse(lat: float, lon: float) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    cache_key = (round(lat, 3), round(lon, 3))
    now = time.time()
    cached = _REVERSE_CACHE.get(cache_key)
    if cached and (now - cached[0]) < _REVERSE_CACHE_TTL_SEC:
        return cached[1], None

    url = f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lon}&addressdetails=1"
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "HeatShieldAI/2.0 (https://github.com/ai-mohitkumar/HeatMap-AI)",
                "Accept-Language": "en",
            },
        )
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            if resp.status != 200:
                reason = f"Nominatim returned HTTP {resp.status}"
                logger.warning("Nominatim reverse geocode HTTP %s for (%.4f, %.4f)", resp.status, lat, lon)
                return None, reason
            payload = json.loads(resp.read().decode("utf-8"))
            if "error" in payload:
                reason = f"Nominatim error: {payload['error']}"
                logger.warning("Nominatim reverse geocode returned error for (%.4f, %.4f): %s", lat, lon, payload["error"])
                return None, reason
            if len(_REVERSE_CACHE) >= _REVERSE_CACHE_MAX_ENTRIES:
                oldest_key = min(_REVERSE_CACHE, key=lambda k: _REVERSE_CACHE[k][0])
                _REVERSE_CACHE.pop(oldest_key, None)
            _REVERSE_CACHE[cache_key] = (now, payload)
            return payload, None
    except Exception as exc:
        logger.warning("Nominatim reverse geocode failed for (%.4f, %.4f): %s", lat, lon, exc)
        return None, str(exc)


def _query_bigdatacloud_reverse(lat: float, lon: float) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    url = (
        f"https://api.bigdatacloud.net/data/reverse-geocode-client"
        f"?latitude={lat:.6f}&longitude={lon:.6f}&localityLanguage=en"
    )
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "HeatShieldAI/2.0 (https://github.com/ai-mohitkumar/HeatMap-AI)",
                "Accept": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            if resp.status != 200:
                return None, f"BigDataCloud returned HTTP {resp.status}"
            payload = json.loads(resp.read().decode("utf-8"))
            if isinstance(payload, dict) and (
                payload.get("city")
                or payload.get("locality")
                or payload.get("principalSubdivision")
            ):
                return payload, None
            return None, "BigDataCloud returned empty place payload"
    except Exception as exc:
        logger.warning("BigDataCloud reverse geocode failed for (%.4f, %.4f): %s", lat, lon, exc)
        return None, str(exc)


@router.get("/reverse", response_model=Dict[str, Any])
def reverse_geocode(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude")
):
    """
    Reverse geocodes GPS coordinates via Nominatim (with BigDataCloud fallback) while retaining
    original coordinates and matching against India district records (Haversine centroid only when offline).
    """
    in_india = 6.0 <= lat <= 38.0 and 68.0 <= lon <= 98.0
    nearest = find_nearest_district(lat, lon) if in_india else None

    nom_data, err_reason = _query_nominatim_reverse(lat, lon)
    if nom_data:
        addr = nom_data.get("address", {})
        place_name = (
            addr.get("city")
            or addr.get("town")
            or addr.get("village")
            or addr.get("suburb")
            or addr.get("neighbourhood")
            or addr.get("hamlet")
            or addr.get("municipality")
            or nom_data.get("name")
        )
        raw_district = addr.get("state_district") or addr.get("county") or ""
        clean_district = raw_district.replace(" District", "").replace(" district", "").strip()
        state_name = addr.get("state") or addr.get("region")
        country_name = addr.get("country")

        matched_district = find_district_by_name(clean_district, state_name) if clean_district else None
        if matched_district:
            dist_km = round(_haversine_km(lat, lon, matched_district["latitude"], matched_district["longitude"]), 1)
            district_obj = matched_district
        elif nearest:
            dist_km = nearest["distance_km"]
            district_obj = nearest["district"]
        else:
            dist_km = 0.0
            district_obj = {
                "district_name": clean_district or place_name or "Unknown",
                "state_name": state_name or "",
                "state_code": "",
                "latitude": lat,
                "longitude": lon,
                "climate_zone": "Global",
            }

        resolved_district_name = clean_district or district_obj["district_name"]
        return {
            "place_name": place_name or resolved_district_name,
            "city": addr.get("city") or addr.get("town") or addr.get("village") or place_name,
            "locality": addr.get("suburb") or addr.get("neighbourhood") or addr.get("village"),
            "district_name": resolved_district_name,
            "district": district_obj,
            "state": state_name or district_obj.get("state_name"),
            "state_code": district_obj.get("state_code", ""),
            "country": country_name or ("India" if in_india else None),
            "display_name": nom_data.get("display_name"),
            "distance_km": dist_km,
            "latitude": lat,
            "longitude": lon,
            "climate_zone": district_obj.get("climate_zone", "Standard"),
            "reverse_source": "nominatim",
            "is_approximate_centroid": False,
            "nearest_centroid": (
                {
                    "district_name": nearest["district"]["district_name"],
                    "state_name": nearest["state"],
                    "distance_km": nearest["distance_km"],
                }
                if nearest
                else None
            ),
        }

    # Secondary online reverse-geocode fallback (avoids false offline centroid when Nominatim 429s)
    bdc_data, bdc_err = _query_bigdatacloud_reverse(lat, lon)
    if bdc_data:
        admin_list = (bdc_data.get("localityInfo") or {}).get("administrative") or []
        admin_district = ""
        for entry in admin_list:
            if isinstance(entry, dict) and entry.get("adminLevel") in (5, 6) and entry.get("name"):
                admin_district = str(entry["name"])
                break
        clean_district = (
            admin_district.replace(" District", "")
            .replace(" district", "")
            .strip()
        )
        place_name = (
            bdc_data.get("city")
            or bdc_data.get("locality")
            or clean_district
        )
        state_name = bdc_data.get("principalSubdivision")
        country_name = bdc_data.get("countryName")
        resolved_district_name = clean_district or (place_name or "Unknown")

        matched_district = find_district_by_name(resolved_district_name, state_name) if resolved_district_name else None
        if matched_district:
            dist_km = round(_haversine_km(lat, lon, matched_district["latitude"], matched_district["longitude"]), 1)
            district_obj = matched_district
        elif nearest:
            dist_km = nearest["distance_km"]
            district_obj = nearest["district"]
        else:
            dist_km = 0.0
            district_obj = {
                "district_name": resolved_district_name,
                "state_name": state_name or "",
                "state_code": "",
                "latitude": lat,
                "longitude": lon,
                "climate_zone": "Global",
            }

        return {
            "place_name": place_name or resolved_district_name,
            "city": bdc_data.get("city") or bdc_data.get("locality") or place_name,
            "locality": bdc_data.get("locality"),
            "district_name": district_obj.get("district_name", resolved_district_name),
            "district": district_obj,
            "state": state_name or district_obj.get("state_name"),
            "state_code": district_obj.get("state_code", ""),
            "country": country_name or ("India" if in_india else None),
            "display_name": ", ".join([p for p in [place_name, state_name, country_name] if p]),
            "distance_km": dist_km,
            "latitude": lat,
            "longitude": lon,
            "climate_zone": district_obj.get("climate_zone", "Standard"),
            "reverse_source": "bigdatacloud",
            "is_approximate_centroid": False,
            "nearest_centroid": (
                {
                    "district_name": nearest["district"]["district_name"],
                    "state_name": nearest["state"],
                    "distance_km": nearest["distance_km"],
                }
                if nearest
                else None
            ),
        }

    if bdc_err:
        err_reason = f"{err_reason}; {bdc_err}" if err_reason else bdc_err

    # Offline / Nominatim unreachable fallback
    if nearest:
        return {
            **nearest,
            "place_name": nearest["district"]["district_name"],
            "district_name": nearest["district"]["district_name"],
            "latitude": lat,
            "longitude": lon,
            "centroid_latitude": nearest["latitude"],
            "centroid_longitude": nearest["longitude"],
            "reverse_source": "local_centroid_fallback",
            "is_approximate_centroid": True,
            "fallback_reason": err_reason or "Nominatim unreachable",
        }

    raise HTTPException(
        status_code=503,
        detail=f"Reverse geocoding unavailable outside India and Nominatim failed ({err_reason}).",
    )

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
