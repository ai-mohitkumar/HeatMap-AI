"""
Regression & Integration Test Suite for Geolocation, Reverse Geocoding,
Trusted-Proxy IP Security, Live vs Offline Weather Provenance, and Rothfusz Physics.
"""

import json
import urllib.error
from typing import Any, Dict, List
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from backend.api import geo as geo_api
from backend.data.geo_data import find_nearest_district
from backend.main import app
from backend.ml.physics import (
    classify_heat_index_tier,
    compute_heat_index_c,
    compute_live_hsi,
)


class _MockHTTPResponse:
    """Minimal context-manager mock for urllib.request.urlopen responses."""

    def __init__(self, payload: Dict[str, Any], status: int = 200):
        self._body = json.dumps(payload).encode("utf-8")
        self.status = status

    def read(self) -> bytes:
        return self._body

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


@pytest.fixture
def client():
    return TestClient(app, client=("127.0.0.1", 50000))


# ---------------------------------------------------------------------------
# Bug 1 & Bug 2: No hardcoded Patna default & trusted-proxy IP security
# ---------------------------------------------------------------------------

def test_ip_loopback_returns_unavailable_never_patna(client, monkeypatch):
    """Loopback client requests must return explicit 'unavailable' without defaulting to Patna."""
    monkeypatch.delenv("TRUSTED_PROXY_IPS", raising=False)
    resp = client.get("/api/geo/ip")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "unavailable"
    assert data["is_default"] is False
    assert data["city"] is None
    assert data["latitude"] is None
    assert data["longitude"] is None
    assert data["location_source"] == "unavailable"
    assert data["used_forwarded_header"] is False


def test_ip_spoofed_forwarded_header_ignored(client, monkeypatch):
    """Arbitrary X-Forwarded-For headers must be ignored when peer is not allowlisted."""
    monkeypatch.delenv("TRUSTED_PROXY_IPS", raising=False)
    resp = client.get(
        "/api/geo/ip",
        headers={"X-Forwarded-For": "49.36.1.2", "X-Real-IP": "49.36.1.2"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "unavailable"
    assert data["used_forwarded_header"] is False
    assert data["ip"] == "127.0.0.1"
    assert data["latitude"] is None


def test_ip_trusted_proxy_resolves_forwarded_public_ip(client, monkeypatch):
    """When TRUSTED_PROXY_IPS allowlists the socket peer, resolve forwarded public IP accurately."""
    monkeypatch.setenv("TRUSTED_PROXY_IPS", "127.0.0.1")

    def fake_urlopen(req, timeout=3.0):
        assert "49.36.1.2" in req.full_url
        assert req.full_url.startswith("https://")
        return _MockHTTPResponse(
            {
                "success": True,
                "latitude": 26.9124,
                "longitude": 75.7873,
                "city": "Jaipur",
                "region": "Rajasthan",
                "country": "India",
            }
        )

    with patch("urllib.request.urlopen", side_effect=fake_urlopen):
        resp = client.get("/api/geo/ip", headers={"X-Forwarded-For": "49.36.1.2"})

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "resolved"
    assert data["ip"] == "49.36.1.2"
    assert data["city"] == "Jaipur"
    assert data["district"] == "Jaipur"
    assert data["state"] == "Rajasthan"
    assert data["latitude"] == pytest.approx(26.9124, abs=1e-4)
    assert data["longitude"] == pytest.approx(75.7873, abs=1e-4)
    assert data["location_source"] == "ip_geolocation"
    assert data["used_forwarded_header"] is True
    assert data["is_default"] is False


def test_ip_provider_failure_returns_unavailable(client, monkeypatch):
    """External IP lookup failures must return explicit unavailable instead of any city fallback."""
    monkeypatch.setenv("TRUSTED_PROXY_IPS", "127.0.0.1")

    with patch("urllib.request.urlopen", side_effect=urllib.error.URLError("DNS timeout")):
        resp = client.get("/api/geo/ip", headers={"X-Forwarded-For": "49.36.1.2"})

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "unavailable"
    assert data["used_forwarded_header"] is True
    assert data["is_default"] is False
    assert data["latitude"] is None
    assert data["city"] is None


# ---------------------------------------------------------------------------
# Bug 3: True reverse geocoding vs explicit Haversine centroid fallback
# ---------------------------------------------------------------------------

def test_reverse_geocode_nominatim_preserves_gps_coords(client):
    """
    Nominatim reverse geocoding must name the actual administrative place/district
    while preserving the user's exact input GPS coordinates.
    """
    geo_api._REVERSE_CACHE.clear()

    def fake_nominatim(req, timeout=3.0):
        assert "nominatim.openstreetmap.org/reverse" in req.full_url
        return _MockHTTPResponse(
            {
                "name": "Danapur",
                "display_name": "Danapur, Saran District, Bihar, India",
                "address": {
                    "town": "Danapur",
                    "state_district": "Saran District",
                    "state": "Bihar",
                    "country": "India",
                },
            }
        )

    # Coordinate slightly closer to Patna centroid geometrically, but explicitly in Saran via reverse geocode
    lat, lon = 25.6712, 85.0198
    with patch("urllib.request.urlopen", side_effect=fake_nominatim):
        resp = client.get(f"/api/geo/reverse?lat={lat}&lon={lon}")

    assert resp.status_code == 200
    data = resp.json()
    assert data["reverse_source"] == "nominatim"
    assert data["is_approximate_centroid"] is False
    assert data["place_name"] == "Danapur"
    assert data["district_name"] == "Saran"
    assert data["latitude"] == pytest.approx(lat, abs=1e-6)
    assert data["longitude"] == pytest.approx(lon, abs=1e-6)


def test_reverse_geocode_offline_fallback_flags_approximate_centroid(client):
    """
    When Nominatim is unreachable inside India, fallback uses Haversine nearest centroid
    explicitly flagged with is_approximate_centroid=True while keeping input coordinates.
    """
    geo_api._REVERSE_CACHE.clear()
    lat, lon = 25.5900, 85.1300
    with patch("urllib.request.urlopen", side_effect=urllib.error.URLError("offline")):
        resp = client.get(f"/api/geo/reverse?lat={lat}&lon={lon}")

    assert resp.status_code == 200
    data = resp.json()
    assert data["reverse_source"] == "local_centroid_fallback"
    assert data["is_approximate_centroid"] is True
    assert data["latitude"] == pytest.approx(lat, abs=1e-6)
    assert data["longitude"] == pytest.approx(lon, abs=1e-6)
    assert "centroid_latitude" in data and "centroid_longitude" in data
    assert data["district_name"] == "Patna"
    assert data["distance_km"] < 5.0


def test_reverse_geocode_global_coordinates_supported(client):
    """Reverse geocoding works outside India bounds when Nominatim responds."""
    geo_api._REVERSE_CACHE.clear()

    def fake_nominatim(req, timeout=3.0):
        return _MockHTTPResponse(
            {
                "name": "Westminster",
                "display_name": "London, Greater London, England, United Kingdom",
                "address": {
                    "city": "London",
                    "state": "England",
                    "country": "United Kingdom",
                },
            }
        )

    with patch("urllib.request.urlopen", side_effect=fake_nominatim):
        resp = client.get("/api/geo/reverse?lat=51.5074&lon=-0.1278")

    assert resp.status_code == 200
    data = resp.json()
    assert data["reverse_source"] == "nominatim"
    assert data["city"] == "London"
    assert data["country"] == "United Kingdom"
    assert data["latitude"] == pytest.approx(51.5074, abs=1e-4)
    assert data["longitude"] == pytest.approx(-0.1278, abs=1e-4)


def test_haversine_nearest_district_accuracy():
    """Haversine nearest district lookup finds the actual nearest centroid with accurate km."""
    res = find_nearest_district(26.9124, 75.7873)
    assert res["district"]["district_name"] == "Jaipur"
    assert res["distance_km"] < 15.0


# ---------------------------------------------------------------------------
# Thermodynamic Physics & Rothfusz Steadman Gate
# ---------------------------------------------------------------------------

def test_heat_index_steadman_gate_and_rothfusz_celsius():
    """
    Verify Steadman gate (< 80°F) avoids Rothfusz artifacts on cool temperatures,
    and hot/humid + hot/dry regimes compute accurate NWS Rothfusz Heat Index in °C.
    """
    # Cool weather (< 80°F threshold): should not inflate abnormally
    cool_hi = compute_heat_index_c(20.0, 50.0)
    assert 19.0 <= cool_hi <= 20.5

    # Hot + humid condition: Heat Index significantly exceeds ambient temperature
    humid_hi = compute_heat_index_c(40.0, 60.0)
    assert humid_hi > 53.0
    assert classify_heat_index_tier(humid_hi) == "Extreme"

    # Hot + arid adjustment (RH < 13%, 80F <= T <= 112F) stays below ambient air temp
    dry_hi = compute_heat_index_c(42.0, 10.0)
    assert 38.0 <= dry_hi <= 42.0

    # HSI clamping check
    assert 5 <= compute_live_hsi(40.0, humid_hi, 43.0, 8.0) <= 99


# ---------------------------------------------------------------------------
# Bug 4 & Weather Consistency: Live vs Forecast vs Offline Estimate Separation
# ---------------------------------------------------------------------------

def test_live_weather_online_and_offline_separation(client):
    """
    Live weather endpoint must request &timezone=auto, return explicit live metadata when reachable,
    and explicitly tag NOAA GSOD IDW fallback as offline_estimate with observed_at=None when failing.
    """
    captured_urls: List[str] = []

    def fake_open_meteo(req, timeout=3.5):
        captured_urls.append(req.full_url)
        return _MockHTTPResponse(
            {
                "timezone": "Asia/Kolkata",
                "utc_offset_seconds": 19800,
                "current": {
                    "time": "2026-05-15T14:30",
                    "temperature_2m": 41.2,
                    "relative_humidity_2m": 48.0,
                    "dew_point_2m": 28.1,
                    "apparent_temperature": 49.5,
                    "surface_pressure": 1002.4,
                    "wind_speed_10m": 12.0,
                },
                "daily": {"temperature_2m_max": [43.5]},
            }
        )

    with patch("urllib.request.urlopen", side_effect=fake_open_meteo):
        online_resp = client.get("/api/safety/weather/live?latitude=26.9124&longitude=75.7873")

    assert online_resp.status_code == 200
    assert len(captured_urls) == 1
    assert "timezone=auto" in captured_urls[0]

    online_data = online_resp.json()
    assert online_data["is_live"] is True
    assert online_data["source_type"] == "live_observation"
    assert online_data["provider"] == "Open-Meteo"
    assert online_data["observed_at"] == "2026-05-15T14:30"
    assert online_data["timezone"] == "Asia/Kolkata"
    assert online_data["fallback_reason"] is None
    assert online_data["heat_index_c"] == compute_heat_index_c(41.2, 48.0)

    # Offline fallback verification (same endpoint when external API unreachable)
    with patch("urllib.request.urlopen", side_effect=urllib.error.URLError("Network unreachable")):
        offline_resp = client.get("/api/safety/weather/live?latitude=26.9124&longitude=75.7873")

    assert offline_resp.status_code == 200
    offline_data = offline_resp.json()
    assert offline_data["is_live"] is False
    assert offline_data["source_type"] == "offline_estimate"
    assert offline_data["provider"] == "NOAA GSOD IDW"
    assert offline_data["observed_at"] is None
    assert isinstance(offline_data["temperature_c"], float)
    assert isinstance(offline_data["heat_index_c"], float)
    assert offline_data["fallback_reason"]


def test_hourly_forecast_online_and_offline_separation(client):
    """
    Hourly forecast uses Open-Meteo &timezone=auto when online and clearly marks source_type='forecast';
    falls back to diurnal NOAA GSOD model marked source_type='offline_estimate' when offline.
    """
    captured_urls: List[str] = []

    def fake_hourly_open_meteo(req, timeout=3.0):
        captured_urls.append(req.full_url)
        times = [f"2026-05-15T{h:02d}:00" for h in range(24)]
        temps = [27.0 + (h if h <= 14 else 28 - h) * 0.9 for h in range(24)]
        rhs = [70.0 - (h if h <= 14 else 28 - h) * 2.0 for h in range(24)]
        return _MockHTTPResponse(
            {
                "timezone": "Asia/Kolkata",
                "hourly": {
                    "time": times,
                    "temperature_2m": temps,
                    "relative_humidity_2m": rhs,
                },
            }
        )

    with patch("urllib.request.urlopen", side_effect=fake_hourly_open_meteo):
        online_resp = client.get("/api/safety/forecast/hourly?latitude=26.9124&longitude=75.7873")

    assert online_resp.status_code == 200
    assert len(captured_urls) == 1
    assert "timezone=auto" in captured_urls[0]

    online_data = online_resp.json()
    assert online_data["source_type"] == "forecast"
    assert online_data["is_live"] is True
    assert online_data["timezone"] == "Asia/Kolkata"
    assert online_data["fallback_reason"] is None
    assert len(online_data["hourly"]) == 15
    sample_pt = online_data["hourly"][8]
    assert sample_pt["heat_index_c"] == compute_heat_index_c(sample_pt["temp_c"], sample_pt["humidity_pct"])

    # Offline diurnal fallback
    with patch("urllib.request.urlopen", side_effect=urllib.error.URLError("Offline mode")):
        offline_resp = client.get("/api/safety/forecast/hourly?latitude=26.9124&longitude=75.7873")

    assert offline_resp.status_code == 200
    offline_data = offline_resp.json()
    assert offline_data["source_type"] == "offline_estimate"
    assert offline_data["is_live"] is False
    assert offline_data["fallback_reason"]
    assert len(offline_data["hourly"]) == 15


def test_predict_location_preserves_coords_and_provenance(client):
    """
    predict/location preserves submitted coordinates and location_source ('ip_geolocation', etc.)
    while separating live/offline estimation from NOAA GSOD research baseline.
    """
    resp = client.post(
        "/api/safety/predict/location",
        json={
            "latitude": 19.076,
            "longitude": 72.8777,
            "accuracy_m": 15000.0,
            "mode": "offline",
            "location_source": "ip_geolocation",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["location"]["latitude"] == pytest.approx(19.076, abs=1e-4)
    assert data["location"]["longitude"] == pytest.approx(72.8777, abs=1e-4)
    assert data["location"]["source"] == "ip_geolocation"
    assert data["location_source"] == "ip_geolocation"
    assert data["data_source"]["source_type"] == "offline_estimate"
    assert data["data_source"]["is_live"] is False
    assert data["data_source"]["observed_at"] is None
    assert "research_baseline" in data["data_source"]
    assert len(data["data_source"]["stations_used"]) > 0


# ---------------------------------------------------------------------------
# Deployment Readiness: Health, CORS, Render CIDR Proxy & File Checks
# ---------------------------------------------------------------------------

def test_deployment_health_and_cors(client, monkeypatch):
    """
    /api/health reports ML readiness, station count, and proxy configuration state,
    and cross-origin GET responses emit CORS headers safely for Vercel -> Render deploys.
    """
    monkeypatch.setenv("TRUSTED_PROXY_IPS", "127.0.0.1,10.0.0.0/8,100.64.0.0/10")
    resp = client.get(
        "/api/health",
        headers={"Origin": "https://heat-map-ai.vercel.app"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["pipeline_ready"] is True
    assert data["stations_count"] == 46
    assert data["trusted_proxy_configured"] is True
    assert resp.headers.get("access-control-allow-origin") == "*"


def test_ip_render_cidr_proxy_trusted(monkeypatch):
    """Render internal VPC/CGNAT reverse-proxy CIDR ranges safely unwrap X-Forwarded-For."""
    monkeypatch.setenv("TRUSTED_PROXY_IPS", "127.0.0.1,::1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,100.64.0.0/10")
    render_client = TestClient(app, client=("10.200.14.88", 443))

    def fake_urlopen(req, timeout=3.0):
        assert "103.21.124.5" in req.full_url
        return _MockHTTPResponse(
            {
                "success": True,
                "latitude": 19.076,
                "longitude": 72.8777,
                "city": "Mumbai",
                "region": "Maharashtra",
                "country": "India",
            }
        )

    with patch("urllib.request.urlopen", side_effect=fake_urlopen):
        resp = render_client.get("/api/geo/ip", headers={"X-Forwarded-For": "103.21.124.5"})

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "resolved"
    assert data["ip"] == "103.21.124.5"
    assert data["city"] == "Mumbai"
    assert data["used_forwarded_header"] is True
    assert data["is_default"] is False


def test_cgnat_client_ip_marked_non_routable(monkeypatch):
    """CGNAT 100.64.0.0/10 client IPs without a public XFF hop must be rejected as non-routable."""
    monkeypatch.setenv("TRUSTED_PROXY_IPS", "10.0.0.0/8,100.64.0.0/10")
    cgnat_client = TestClient(app, client=("10.200.14.88", 443))
    resp = cgnat_client.get("/api/geo/ip", headers={"X-Forwarded-For": "100.64.12.34"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "unavailable"
    assert data["is_default"] is False
    assert data["latitude"] is None


# ---------------------------------------------------------------------------
# Offline/Online Map Resilience & Downloadable App Bundle Checks
# ---------------------------------------------------------------------------

def test_frontend_relative_assets_and_resilient_map_layers():
    """
    Frontend index.html must use relative ./ asset links (no external unpkg dependency)
    and both MobileMap & PriorityMap must mount ResilientMapLayers + MapResizeObserver.
    """
    from pathlib import Path

    root = Path(__file__).resolve().parent.parent
    index_html = (root / "frontend" / "index.html").read_text(encoding="utf-8")
    assert 'href="./favicon.svg"' in index_html
    assert 'href="./manifest.json"' in index_html
    assert 'href="./leaflet.css"' in index_html
    assert "unpkg.com" not in index_html

    main_tsx = (root / "frontend" / "src" / "main.tsx").read_text(encoding="utf-8")
    assert "HeatShieldNativeGps" in main_tsx
    assert "BASE_URL" in main_tsx

    resilient = (root / "frontend" / "src" / "components" / "shared" / "ResilientMapLayers.tsx").read_text(encoding="utf-8")
    for required_symbol in [
        "OfflineVectorGridLayer",
        "MapResizeObserver",
        "carto_dark",
        "carto_voyager",
        "esri_street",
        "osm_standard",
    ]:
        assert required_symbol in resilient

    for map_file in [
        root / "frontend" / "src" / "components" / "mobile" / "MobileMap.tsx",
        root / "frontend" / "src" / "components" / "PriorityMap.tsx",
    ]:
        src = map_file.read_text(encoding="utf-8")
        assert "ResilientMapLayers" in src
        assert "MapResizeObserver" in src


def test_download_package_builder_and_manifest_integrity():
    """
    Verify APK/Desktop builder includes loopback asset server, network security config,
    User-Agent cleanups, Coarse/Fine location handling, and valid artifact SHA-256s.
    """
    import hashlib
    import zipfile
    from pathlib import Path

    root = Path(__file__).resolve().parent.parent
    builder_src = (root / "scripts" / "build_download_packages.py").read_text(encoding="utf-8")
    for required_token in [
        "LocalAssetServer",
        "network_security_config",
        "replace(\"; wv)\", \")\")",
        "ACCESS_COARSE_LOCATION",
        "shouldOverrideUrlLoading",
        "server.ps1",
        "server.py",
        "launch-mac-linux.sh",
    ]:
        assert required_token in builder_src, f"Missing {required_token} in build_download_packages.py"

    downloads_dir = root / "frontend" / "public" / "downloads"
    manifest_path = downloads_dir / "downloads-manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        pkgs = manifest.get("packages", {})
        assert set(pkgs.keys()) >= {"android", "ios", "smartwatch", "desktop", "master"}
        for key, meta in pkgs.items():
            pkg_file = downloads_dir / meta["fileName"]
            assert pkg_file.exists(), f"Missing downloadable artifact for {key}: {pkg_file}"
            digest = hashlib.sha256(pkg_file.read_bytes()).hexdigest()
            assert digest == meta["sha256"], f"SHA-256 mismatch for {meta['fileName']}"

        apk_file = downloads_dir / pkgs["android"]["fileName"]
        with zipfile.ZipFile(apk_file, "r") as zf:
            names = set(zf.namelist())
            assert "AndroidManifest.xml" in names
            assert "classes.dex" in names
            assert "res/xml/network_security_config.xml" in names
            assert "assets/web/index.html" in names

        desktop_file = downloads_dir / pkgs["desktop"]["fileName"]
        with zipfile.ZipFile(desktop_file, "r") as zf:
            names = set(zf.namelist())
            assert "HeatShield-AI.bat" in names
            assert "server.py" in names
            assert "server.ps1" in names
            assert "launch-mac-linux.sh" in names
            assert "web/index.html" in names


def test_reverse_geocode_nominatim_429_falls_back_to_bigdatacloud(client):
    """
    When Nominatim rate-limits (HTTP 429) on cloud hosts, reverse_geocode must
    fall back to BigDataCloud and avoid flagging offline centroid fallback.
    """
    geo_api._REVERSE_CACHE.clear()
    lat, lon = 26.9124, 75.7873

    def fake_urlopen(req, timeout=3.0):
        if "nominatim.openstreetmap.org" in req.full_url:
            raise urllib.error.HTTPError(
                req.full_url, 429, "Too Many Requests", hdrs=None, fp=None
            )
        if "api.bigdatacloud.net" in req.full_url:
            return _MockHTTPResponse(
                {
                    "city": "Jaipur",
                    "locality": "Bani Park",
                    "principalSubdivision": "Rajasthan",
                    "countryName": "India",
                    "localityInfo": {
                        "administrative": [
                            {"adminLevel": 5, "name": "Jaipur District"}
                        ]
                    },
                }
            )
        raise AssertionError(f"Unexpected URL requested: {req.full_url}")

    with patch("urllib.request.urlopen", side_effect=fake_urlopen):
        resp = client.get(f"/api/geo/reverse?lat={lat}&lon={lon}")

    assert resp.status_code == 200
    data = resp.json()
    assert data["reverse_source"] == "bigdatacloud"
    assert data["is_approximate_centroid"] is False
    assert data["city"] == "Jaipur"
    assert data["district_name"] == "Jaipur"
    assert data["latitude"] == pytest.approx(lat, abs=1e-6)
    assert data["longitude"] == pytest.approx(lon, abs=1e-6)


def test_live_location_resilience_tokens():
    """
    Verify geolocation service, native APK bridge, and map components preserve
    preliminary IP display, multi-provider fallbacks, and live pin rendering controls.
    """
    from pathlib import Path

    root = Path(__file__).resolve().parent.parent

    geo_ts = (root / "frontend" / "src" / "utils" / "geolocationService.ts").read_text(encoding="utf-8")
    for token in [
        "free.freeipapi.com/api/v1/json",
        "get.geojs.io/v1/ip/geo.json",
        "offline_local_bundle",
        "onPreliminaryLocation",
        "firstFulfilled",
        "__onNativeGpsPermissionResult",
    ]:
        assert token in geo_ts, f"Missing {token} in geolocationService.ts"

    builder_src = (root / "scripts" / "build_download_packages.py").read_text(encoding="utf-8")
    for token in [
        "isWaitingForPermission",
        "__onNativeGpsPermissionResult",
        "requestLocationUpdates",
    ]:
        assert token in builder_src, f"Missing {token} in build_download_packages.py"

    priority_map = (root / "frontend" / "src" / "components" / "PriorityMap.tsx").read_text(encoding="utf-8")
    assert "Center on My Pin" in priority_map
    assert "hasVerifiedUser" in priority_map

    mobile_map = (root / "frontend" / "src" / "components" / "mobile" / "MobileMap.tsx").read_text(encoding="utf-8")
    assert "hasVerifiedLocation" in mobile_map
    assert "Refining GPS..." in mobile_map
