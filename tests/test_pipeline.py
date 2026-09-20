"""
Unit and Integration Test Suite for HeatShield AI
Tests multi-year data loader, preprocessor, feature formulas, continuous HSI,
K-Means, Hierarchical, PCA, UMAP, Explainability, Temporal tracking, and FastAPI endpoints.
"""

import pytest
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

from backend.ml.data_loader import generate_multiyear_noaa_gsod, generate_noaa_gsod_dataset
from backend.ml.preprocessing import NOAADataPreprocessor
from backend.ml.feature_engineering import HeatStressFeatureEngineer
from backend.ml.kmeans import KMeansClusterEngine
from backend.ml.hierarchical import HierarchicalClusterEngine
from backend.ml.validation import OptimalKSelector
from backend.ml.pca_analysis import PCAReducer
from backend.ml.umap_analysis import UMAPReducer
from backend.ml.profiles import VulnerabilityProfiler
from backend.ml.explainability import StationExplainer
from backend.ml.temporal_analysis import TemporalAnalyzer
from backend.main import app

# --- Unit Tests: Data & Preprocessing ---

def test_multiyear_data_generation():
    df = generate_multiyear_noaa_gsod(years=[2022, 2023, 2024, 2025], samples_per_year=920, random_seed=42)
    assert len(df) == 3680
    assert len(df["STATION"].unique()) == 46
    expected_cols = ["STATION", "NAME", "LATITUDE", "LONGITUDE", "DATE", "YEAR", "TEMP", "MAX", "MIN", "DEWP", "SLP", "WDSP", "PRCP"]
    for col in expected_cols:
        assert col in df.columns
    assert set(df["YEAR"].unique()) == {2022, 2023, 2024, 2025}

def test_preprocessing_pipeline():
    preprocessor = NOAADataPreprocessor()
    df_raw = generate_noaa_gsod_dataset(n_samples=50, random_seed=42)
    df_raw.loc[0, "DEWP"] = 9999.9
    
    processed = preprocessor.prepare_raw_data(df_raw)
    assert not processed["dewp_c"].isna().any()
    assert "mean_temp_c" in processed.columns
    assert "wind_speed_kmh" in processed.columns
    assert "pressure_hpa" in processed.columns
    assert "is_heat_season" in processed.columns

# --- Unit Tests: Biometeorological Feature Engineering & HSI ---

def test_feature_engineering_formulas():
    engineer = HeatStressFeatureEngineer()
    
    temp = pd.Series([22.0, 32.0, 42.0])
    max_t = pd.Series([28.0, 38.0, 48.0])
    dewp = pd.Series([12.0, 22.0, 26.0])
    wind = pd.Series([15.0, 8.0, 4.0])
    
    rh = engineer.calculate_relative_humidity(temp, dewp)
    assert (rh > 0).all() and (rh <= 100).all()

    hi = engineer.calculate_noaa_heat_index(temp, rh)
    assert (hi >= temp - 5.0).all()

    # Continuous Heat Stress Index (HSI: 0 to 100)
    hsi = engineer.calculate_continuous_heat_stress_index(temp, max_t, dewp, hi, wind)
    assert (hsi >= 0.0).all() and (hsi <= 100.0).all()
    # Ensure hot, humid, low-wind condition yields significantly higher HSI than temperate condition
    assert hsi.iloc[2] > hsi.iloc[0]

def test_anova_feature_separation():
    engineer = HeatStressFeatureEngineer()
    df = pd.DataFrame({
        "cluster": [0, 0, 1, 1, 2, 2],
        "mean_temp_c": [20.0, 22.0, 30.0, 32.0, 42.0, 44.0],
        "dew_point_c": [10.0, 12.0, 18.0, 20.0, 24.0, 26.0]
    })
    sep = engineer.calculate_feature_cluster_separation(df, "cluster", ["mean_temp_c", "dew_point_c"])
    assert len(sep) == 2
    assert sep[0]["f_statistic"] > 0
    assert "separation_score" in sep[0]

# --- Unit Tests: Clustering & Dimensionality Reduction ---

def test_kmeans_multi_k_evaluation():
    np.random.seed(42)
    X = np.random.randn(80, 6)
    engine = KMeansClusterEngine(random_state=42)
    evals = engine.evaluate_multi_k(X, k_range=range(2, 6))

    assert len(evals) == 4
    for e in evals:
        assert 2 <= e["k"] <= 5
        assert e["wcss"] > 0
        assert -1.0 <= e["silhouette_score"] <= 1.0

    selector = OptimalKSelector()
    rec = selector.select_optimal_k(evals)
    assert rec["optimal_k"] in [2, 3, 4, 5]
    assert len(rec["rationale"]) > 20

def test_pca_and_umap():
    np.random.seed(42)
    X = np.random.randn(50, 4)
    pca_engine = PCAReducer(n_components=2)
    pca_res = pca_engine.fit_transform(X, ["f1", "f2", "f3", "f4"])
    assert len(pca_res["coordinates_2d"]) == 50

    umap_engine = UMAPReducer(n_components=2)
    umap_res = umap_engine.fit_transform(X)
    assert len(umap_res["coordinates_2d"]) == 50

def test_station_explainability():
    df = pd.DataFrame({
        "STATION": ["123", "456"],
        "NAME": ["Test Station Alpha", "Test Station Beta"],
        "LATITUDE": [28.0, 19.0],
        "LONGITUDE": [77.0, 72.0],
        "cluster": [1, 0],
        "mean_temp_c": [38.0, 24.0],
        "max_temp_c": [44.0, 30.0],
        "dew_point_c": [24.0, 14.0],
        "heat_index_c": [46.0, 26.0],
        "wind_speed_kmh": [5.0, 15.0],
        "heat_stress_index": [88.0, 25.0]
    })
    profiles = [
        {"cluster_id": 0, "title": "Profile A", "vulnerability_tier": "Low", "color_code": "#10B981"},
        {"cluster_id": 1, "title": "Profile D", "vulnerability_tier": "Extreme", "color_code": "#7C3AED"}
    ]
    exp = StationExplainer.explain_station("123", df, profiles)
    assert exp["station_id"] == "123"
    assert exp["vulnerability_tier"] == "Extreme"
    assert len(exp["key_contributing_indicators"]) == 5
    assert len(exp["explanation"]) > 20

# --- Integration Tests: FastAPI Endpoints ---

def test_fastapi_endpoints():
    client = TestClient(app)

    # 1. Health check
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

    # 2. Dataset summary
    resp = client.get("/api/dataset/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert data["unique_stations"] > 0
    assert len(data["available_years"]) >= 1
    assert "mean_heat_stress_index" in data

    # 3. Clustering evaluations
    resp = client.get("/api/clustering/evaluations")
    assert resp.status_code == 200

    # 4. Optimal K
    resp = client.get("/api/clustering/optimal-k")
    assert resp.status_code == 200

    # 5. Profiles
    resp = client.get("/api/clustering/profiles")
    assert resp.status_code == 200
    profiles = resp.json()
    assert len(profiles) > 0
    assert "profile_code" in profiles[0]

    # 6. PCA & UMAP
    resp = client.get("/api/analysis/pca")
    assert resp.status_code == 200
    resp_umap = client.get("/api/analysis/umap")
    assert resp_umap.status_code == 200
    assert len(resp_umap.json()["points"]) > 0

    # 7. Map stations & Explainability
    resp = client.get("/api/analysis/map-stations?limit=50")
    assert resp.status_code == 200
    stations = resp.json()
    first_st_id = stations[0]["station_id"]

    resp_exp = client.get(f"/api/analysis/explain-station/{first_st_id}")
    assert resp_exp.status_code == 200
    assert "key_contributing_indicators" in resp_exp.json()

    # 8. Feature separation
    resp = client.get("/api/analysis/feature-separation")
    assert resp.status_code == 200
    assert len(resp.json()) > 0

    # 9. AI Insights
    resp = client.get("/api/analysis/ai-insights")
    assert resp.status_code == 200
    assert "key_takeaways" in resp.json()

    # 10. Temporal annual shifts & station transitions
    resp = client.get("/api/temporal/annual-shifts")
    assert resp.status_code == 200
    assert len(resp.json()) > 0

    resp_trans = client.get(f"/api/temporal/station-transitions/{first_st_id}")
    assert resp_trans.status_code == 200
    assert "annual_history" in resp_trans.json()

    # 10b. Full Multi-Year Transition Matrix Endpoint (All 46 Stations)
    resp_matrix = client.get("/api/temporal/transition-matrix")
    assert resp_matrix.status_code == 200
    matrix_data = resp_matrix.json()
    assert len(matrix_data) == 46
    assert "transition_trajectory" in matrix_data[0]
    assert "y2022_code" in matrix_data[0]
    assert "y2025_code" in matrix_data[0]

    # 11. Data Quality & Coverage Endpoints (Authoritative 3,680 Records)
    resp_quality = client.get("/api/dataset/quality")
    assert resp_quality.status_code == 200
    quality_data = resp_quality.json()
    assert quality_data["total_records"] == 3680
    assert quality_data["data_quality_score"] > 90.0

    resp_coverage = client.get("/api/dataset/coverage")
    assert resp_coverage.status_code == 200
    coverage_data = resp_coverage.json()
    assert coverage_data["total_stations"] == 46
    assert coverage_data["total_observations"] == 3680
    assert len(coverage_data["coverage_by_year"]) == 4

    # 12. Cluster Stability & Radar Centroids Endpoints
    resp_stab = client.get("/api/clustering/stability?k=4")
    assert resp_stab.status_code == 200
    stab_data = resp_stab.json()
    assert stab_data["k"] == 4
    assert stab_data["stability_percentage"] >= 95.0
    assert "mean_pairwise_nmi" in stab_data
    assert len(stab_data.get("seed_agreement_curve", [])) == 20

    resp_radar = client.get("/api/clustering/radar-centroids?k=4")
    assert resp_radar.status_code == 200
    radar_data = resp_radar.json()
    assert len(radar_data["radar_data"]) > 0

    # 13. AI Analyst Natural Language Query Endpoint
    resp_ai = client.post("/api/analysis/ai-query", json={"query": "Why is New Delhi high priority?", "mode": "station"})
    assert resp_ai.status_code == 200
    ai_data = resp_ai.json()
    assert "biometeorological_interpretation" in ai_data
    assert len(ai_data["actionable_directives"]) > 0

    # 14. Public Safety Endpoints
    # 14a. Citizen Risk Assessment
    resp_safety = client.get(f"/api/safety/risk-assessment/{first_st_id}")
    assert resp_safety.status_code == 200
    safety_data = resp_safety.json()
    assert 0 <= safety_data["heat_risk_score"] <= 100
    assert safety_data["tier_badge"] in ["LOW", "MODERATE", "HIGH", "VERY HIGH", "EXTREME"]
    assert len(safety_data["persona_advice"]) == 7
    assert len(safety_data["immediate_actions"]) >= 3
    assert len(safety_data["danger_explanation"]) > 10

    # 14b. Cooling Centers
    resp_centers = client.get(f"/api/safety/cooling-centers/{first_st_id}")
    assert resp_centers.status_code == 200
    centers = resp_centers.json()
    assert len(centers) >= 1
    assert "name" in centers[0]
    assert "distance_km" in centers[0]

    # 14c. Community Heat Assistance Requests & Volunteer Response
    resp_reqs = client.get("/api/safety/community-requests")
    assert resp_reqs.status_code == 200
    reqs = resp_reqs.json()
    assert len(reqs) >= 1

    # Post a new assistance request
    resp_create_req = client.post("/api/safety/community-requests", json={
        "station_id": first_st_id,
        "location_name": "Test Neighborhood",
        "beneficiary_type": "elderly",
        "urgency": "high",
        "title": "Need drinking water cans for senior home",
        "description": "Electricity outage in apartment building, water pumps disabled.",
        "contact_name": "Local Volunteer"
    })
    assert resp_create_req.status_code == 200
    created_req = resp_create_req.json()
    assert created_req["title"] == "Need drinking water cans for senior home"
    new_req_id = created_req["id"]

    # Volunteer to help on that request
    resp_volunteer = client.post(f"/api/safety/community-requests/{new_req_id}/respond")
    assert resp_volunteer.status_code == 200
    assert resp_volunteer.json()["volunteers_signed_up"] >= 1

    # 14d. Daily Heat Brief
    resp_brief = client.get(f"/api/safety/daily-brief/{first_st_id}")
    assert resp_brief.status_code == 200
    brief_data = resp_brief.json()
    assert "trend_summary" in brief_data
    assert "peak_risk_window" in brief_data
    assert "target_hydration_liters" in brief_data

    # 14e. Activity Evaluation (AI Schedule Negotiator)
    resp_act = client.post("/api/safety/evaluate-activity", json={
        "station_id": first_st_id,
        "activity": "Running",
        "planned_hour": 14,
        "duration_mins": 45
    })
    assert resp_act.status_code == 200
    act_data = resp_act.json()
    assert act_data["verdict"] in ["SAFE", "CAUTION", "DANGEROUS"]
    assert "explanation" in act_data
    assert len(act_data["safer_alternatives"]) >= 1

    # 14f. Symptom Triage Screener
    resp_sym = client.post("/api/safety/symptom-check", json={
        "symptoms": ["dizzy", "headache"]
    })
    assert resp_sym.status_code == 200
    sym_data = resp_sym.json()
    assert sym_data["triage_tier"] in ["NORMAL", "WARNING", "EMERGENCY"]
    assert "primary_directive" in sym_data
    assert len(sym_data["action_steps"]) > 0

    # 14g. Multi-City Family Watchlist Status
    resp_fam = client.post("/api/safety/family-status", json={
        "family_members": [
            {"id": "fam-1", "name": "Dad", "relationship": "Parent", "station_id": first_st_id}
        ]
    })
    assert resp_fam.status_code == 200
    fam_data = resp_fam.json()
    assert len(fam_data) == 1
    assert "heat_risk_score" in fam_data[0]
    assert "city_name" in fam_data[0]

    # 14h. Grounded AI Heat Assistant Chat
    resp_chat = client.post("/api/safety/assistant-chat", json={
        "station_id": first_st_id,
        "query": "Can I play cricket at 2 PM today?"
    })
    assert resp_chat.status_code == 200
    chat_data = resp_chat.json()
    assert "answer" in chat_data
    assert "risk_tier" in chat_data

    # 14i. Multilingual Localization Strings
    resp_loc = client.get("/api/safety/localization")
    assert resp_loc.status_code == 200
    loc_data = resp_loc.json()
    assert "en" in loc_data and "hi" in loc_data and "pa" in loc_data
    assert "app_title" in loc_data["en"]
    assert "app_title" in loc_data["hi"]
    assert "app_title" in loc_data["pa"]

    # 14j. Live GPS Location Nearest Station Resolution
    resp_near = client.post("/api/safety/nearest-station", json={
        "latitude": 28.6139,
        "longitude": 77.2090
    })
    assert resp_near.status_code == 200
    near_data = resp_near.json()
    assert near_data["nearest_station_id"] == "42182099999"
    assert near_data["distance_km"] < 30.0
    assert near_data["is_live_gps"] is True
    assert "risk_assessment" in near_data
    assert 0 <= near_data["risk_assessment"]["heat_risk_score"] <= 100

    # 14k. All Stations Live Status & Predictions
    resp_all_live = client.get("/api/safety/live-all-stations")
    assert resp_all_live.status_code == 200
    all_live_data = resp_all_live.json()
    assert all_live_data["total_stations"] == 46
    assert len(all_live_data["stations"]) == 46
    assert "tier_counts" in all_live_data
    assert all_live_data["mean_temperature_c"] > 0
    assert "hottest_station" in all_live_data
    assert "tier_badge" in all_live_data["stations"][0]
    assert "profile_code" in all_live_data["stations"][0]

    # 14l. Exact GPS Location Prediction with IDW Multi-Station Interpolation
    resp_loc_idw = client.post("/api/predict/location", json={
        "latitude": 31.6340,
        "longitude": 74.8723,
        "accuracy_m": 18,
        "mode": "offline"
    })
    assert resp_loc_idw.status_code == 200
    loc_idw_data = resp_loc_idw.json()
    assert loc_idw_data["location"]["latitude"] == 31.6340
    assert loc_idw_data["location"]["accuracy_m"] == 18
    assert "data_source" in loc_idw_data
    assert loc_idw_data["data_source"]["mode"] == "offline"
    assert "IDW" in loc_idw_data["data_source"]["interpolation"]
    stations_used = loc_idw_data["data_source"]["stations_used"]
    assert len(stations_used) == 4
    # Check that weights sum to approx 100%
    total_weight = sum(s["weight_pct"] for s in stations_used)
    assert abs(total_weight - 100.0) < 1.0
    # Nearest station has the largest weight and smallest distance
    assert stations_used[0]["weight_pct"] >= stations_used[1]["weight_pct"]
    assert stations_used[0]["distance_km"] <= stations_used[1]["distance_km"]
    assert "weather" in loc_idw_data
    assert "prediction" in loc_idw_data
    assert 0 <= loc_idw_data["prediction"]["risk_score"] <= 100
    assert loc_idw_data["prediction"]["confidence_score"] > 80
    assert "risk_assessment" in loc_idw_data

    # 14m. Safety Router Location Prediction Endpoint
    resp_safety_loc = client.post("/api/safety/predict-location", json={
        "latitude": 28.6139,
        "longitude": 77.2090,
        "accuracy_m": 25,
        "mode": "offline"
    })
    assert resp_safety_loc.status_code == 200
    safety_loc_data = resp_safety_loc.json()
    assert "DELHI" in safety_loc_data["data_source"]["stations_used"][0]["name"]



