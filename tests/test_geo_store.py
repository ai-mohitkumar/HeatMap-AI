"""
Tests for HeatShield AI Administrative Geography API & Store
Verifies all 36 States/UTs, districts, tehsils, villages, universal resolver, and spatial IDW evaluation.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_states_endpoint(client):
    """Verify all 36 States & Union Territories of India are returned."""
    resp = client.get("/api/geo/states")
    assert resp.status_code == 200
    states = resp.json()
    assert len(states) == 36
    state_names = [s["state_name"] for s in states]
    assert "Bihar" in state_names
    assert "Rajasthan" in state_names
    assert "Maharashtra" in state_names
    assert "Delhi (NCT)" in state_names

def test_districts_filtering(client):
    """Verify districts list and state-based filtering."""
    resp_all = client.get("/api/geo/districts")
    assert resp_all.status_code == 200
    all_districts = resp_all.json()
    assert len(all_districts) >= 30

    resp_bihar = client.get("/api/geo/districts?state=Bihar")
    assert resp_bihar.status_code == 200
    bihar_districts = resp_bihar.json()
    assert len(bihar_districts) == 38
    d_names = [d["district_name"] for d in bihar_districts]
    assert "Patna" in d_names
    assert "Gaya" in d_names
    assert "Muzaffarpur" in d_names
    assert "Buxar" in d_names
    assert "Bhojpur" in d_names
    assert "Kaimur" in d_names

def test_villages_endpoint(client):
    """Verify sub-districts/tehsils and sample villages for a district."""
    resp = client.get("/api/geo/villages?district=Patna")
    assert resp.status_code == 200
    data = resp.json()
    assert data["district_name"] == "Patna"
    assert "Danapur" in data["tehsils"] or "Maner" in data["tehsils"]
    assert "Maner" in data["sample_villages"] or "Khagaul" in data["sample_villages"]

def test_search_endpoint(client):
    """Verify universal search across states, districts, and villages."""
    # 1. Search State
    resp_state = client.get("/api/geo/search?q=Rajasthan")
    assert resp_state.status_code == 200
    assert any(r["type"] == "state" and r["name"] == "Rajasthan" for r in resp_state.json())

    # 2. Search District
    resp_dist = client.get("/api/geo/search?q=Phalodi")
    assert resp_dist.status_code == 200
    assert any("Phalodi" in r["name"] for r in resp_dist.json())

    # 3. Search Village
    resp_village = client.get("/api/geo/search?q=Maner")
    assert resp_village.status_code == 200
    assert any("Maner" in r["name"] for r in resp_village.json())

def test_universal_resolver_all_cases(client):
    """
    Verify that the universal resolver handles:
    Case 1: Known Village/Tehsil
    Case 2: Unindexed village with parent district hint
    Case 3: Completely custom location with state hint
    Case 4: General query
    """
    # Case 1: Known Village
    r1 = client.get("/api/geo/resolve?q=Maner")
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["status"] == "resolved"
    assert "Maner" in d1["location"]["name"]

    # Case 2: Unindexed village in a known district (e.g. Rampur in Patna)
    r2 = client.get("/api/geo/resolve?q=Rampur&district=Patna")
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["status"] == "resolved"
    assert d2["location"]["district_name"] == "Patna"
    assert "latitude" in d2["location"]
    assert "longitude" in d2["location"]

    # Case 3: Completely custom location with state hint
    r3 = client.get("/api/geo/resolve?q=Shantinagar&state=Rajasthan")
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["status"] == "resolved"
    assert d3["location"]["state_name"] == "Rajasthan"

def test_geo_evaluate_endpoint(client):
    """Verify IDW biometeorological evaluation for village coordinates."""
    payload = {
        "latitude": 25.6441,
        "longitude": 85.0601,
        "name": "Maner Village",
        "district_name": "Patna",
        "state_name": "Bihar",
        "accuracy_m": 20.0
    }
    resp = client.post("/api/geo/evaluate", json=payload)
    assert resp.status_code == 200
    res = resp.json()
    assert "weather" in res
    assert "temperature" in res["weather"]
    assert "feels_like" in res["weather"]
    assert "prediction" in res
    assert "risk_level" in res["prediction"]
    assert "data_source" in res
    assert len(res["data_source"]["stations_used"]) == 4
    assert "administrative" in res
    assert res["administrative"]["name"] == "Maner Village"

def test_reverse_geocoding(client):
    """Verify GPS reverse geocoding to nearest district."""
    # Near Patna coordinates (25.59, 85.13)
    resp = client.get("/api/geo/reverse?lat=25.59&lon=85.13")
    assert resp.status_code == 200
    res = resp.json()
    assert res["district"]["district_name"] == "Patna"
    assert res["distance_km"] < 10.0

def test_buxar_district_and_villages(client):
    """Verify Buxar district is present, searchable, and has all 11 tehsils and authentic villages."""
    # 1. Search Buxar
    resp = client.get("/api/geo/search?q=Buxar")
    assert resp.status_code == 200
    results = resp.json()
    assert any(r["name"] == "Buxar" and r["type"] == "district" for r in results)

    # 2. Get Buxar tehsils and villages
    resp_v = client.get("/api/geo/villages?district=Buxar")
    assert resp_v.status_code == 200
    data = resp_v.json()
    assert data["district_name"] == "Buxar"
    # All 11 blocks/tehsils present
    expected_tehsils = [
        "Buxar Sadar", "Dumraon", "Brahmpur", "Simri", "Chausa", "Rajpur",
        "Itarhi", "Nawanagar", "Chaugain", "Kesath", "Chakki"
    ]
    for tehsil in expected_tehsils:
        assert tehsil in data["tehsils"]

    # Authentic villages present
    expected_villages = ["Ahirauli", "Dumraon", "Chausa", "Simri", "Brahmpur", "Itarhi", "Rajpur", "Nawanagar", "Chaugain", "Kesath", "Chakki"]
    for v in expected_villages:
        assert v in data["sample_villages"]

    # 3. Resolve Ahirauli village directly
    resp_res = client.get("/api/geo/resolve?q=Ahirauli&district=Buxar")
    assert resp_res.status_code == 200
    res_data = resp_res.json()
    assert res_data["status"] == "resolved"
    assert "Ahirauli" in res_data["location"]["name"]

    # 4. Resolve Chausa village directly
    resp_chausa = client.get("/api/geo/resolve?q=Chausa")
    assert resp_chausa.status_code == 200
    chausa_data = resp_chausa.json()
    assert chausa_data["status"] == "resolved"
    assert "Chausa" in chausa_data["location"]["name"]


