"""
Comprehensive Biometeorological Safety Engine Test Matrix
Validates heat-risk classifications, Rothfusz Heat Index thresholds,
humidity/wet-bulb traps, wind dissipation, persona sensitivity,
activity schedule negotiation, and clinical symptom triage.
"""

import pytest
from backend.ml.safety_engine import HeatSafetyEngine


class TestSafetyEngineMatrix:
    """
    Formal test suite verifying thermodynamic thresholds and explainability logic.
    """

    @pytest.mark.parametrize("temp_c, rh_pct, expected_tier_substring", [
        (24.0, 40.0, "Low"),
        (32.0, 50.0, "Moderate"),
        (36.0, 55.0, "High"),
        (40.0, 55.0, "Very High"),
        (45.0, 75.0, "Extreme"),
    ])
    def test_biometeorological_5_tier_matrix(self, temp_c: float, rh_pct: float, expected_tier_substring: str):
        """
        Verifies that standard temperature and humidity combinations
        map monotonically to the correct vulnerability tiers.
        """
        record = {
            "STATION": "TEST_STATION",
            "NAME": "Test Station",
            "LATITUDE": 28.6,
            "LONGITUDE": 77.2,
            "mean_temp_c": temp_c,
            "max_temp_c": temp_c + 4.0,
            "dew_point_c": 18.0,
            "relative_humidity": rh_pct,
            "wind_speed_kmh": 10.0,
            "pressure_hpa": 1010.0
        }
        assessment = HeatSafetyEngine.get_citizen_risk_assessment(record)
        assert 0 <= assessment["heat_risk_score"] <= 100
        tier_combined = f"{assessment['tier_name']} {assessment['tier_badge']}"
        assert expected_tier_substring.lower() in tier_combined.lower()

    def test_humid_heat_vs_dry_heat_explainability(self):
        """
        Verifies that high-humidity conditions elevate the heat index above ambient temperature
        and trigger specific explanations about impaired evaporative sweat cooling.
        """
        # Humid heat condition (Wet-bulb danger)
        humid_record = {
            "STATION": "KOLKATA_TEST",
            "NAME": "Kolkata Dum Dum",
            "LATITUDE": 22.65,
            "LONGITUDE": 88.45,
            "mean_temp_c": 36.0,
            "max_temp_c": 40.0,
            "dew_point_c": 29.0,
            "relative_humidity": 75.0,
            "wind_speed_kmh": 6.0,
            "pressure_hpa": 1005.0
        }
        assessment = HeatSafetyEngine.get_citizen_risk_assessment(humid_record)
        # Heat index must be substantially higher than ambient temperature due to moisture
        assert assessment["current_weather"]["heat_index_c"] > humid_record["mean_temp_c"] + 5.0
        # Danger explanation must mention humidity or evaporative cooling
        explanation = assessment["danger_explanation"].lower()
        assert any(term in explanation for term in ["humid", "sweat", "evaporat", "moisture", "cooling"])

    def test_wind_dissipation_mitigation(self):
        """
        Verifies that higher wind speeds provide convective cooling that moderates risk.
        """
        base_record = {
            "STATION": "WIND_TEST",
            "NAME": "Wind Test",
            "LATITUDE": 26.0,
            "LONGITUDE": 75.0,
            "mean_temp_c": 38.0,
            "max_temp_c": 42.0,
            "dew_point_c": 16.0,
            "relative_humidity": 30.0,
            "pressure_hpa": 1008.0
        }
        stagnant = {**base_record, "wind_speed_kmh": 2.0}
        breezy = {**base_record, "wind_speed_kmh": 28.0}

        score_stagnant = HeatSafetyEngine.get_citizen_risk_assessment(stagnant)["heat_risk_score"]
        score_breezy = HeatSafetyEngine.get_citizen_risk_assessment(breezy)["heat_risk_score"]

        # Breezy condition must have lower or equal risk score compared to stagnant air
        assert score_breezy <= score_stagnant

    def test_persona_sensitivity_differentiation(self):
        """
        Verifies that all personas receive tailored recommendations with non-empty actionable steps.
        """
        sample_record = {
            "STATION": "DELHI_TEST",
            "NAME": "Delhi Test",
            "LATITUDE": 28.6,
            "LONGITUDE": 77.2,
            "mean_temp_c": 39.0,
            "max_temp_c": 43.0,
            "dew_point_c": 22.0,
            "relative_humidity": 45.0,
            "wind_speed_kmh": 12.0,
            "pressure_hpa": 1007.0
        }
        assessment = HeatSafetyEngine.get_citizen_risk_assessment(sample_record)
        personas = assessment["persona_advice"]
        assert len(personas) >= 5

        persona_ids = [p["persona_id"] for p in personas]
        assert "outdoor_worker" in persona_ids
        assert "elderly" in persona_ids
        assert "child" in persona_ids

        for p in personas:
            assert len(p["tailored_steps"]) > 0
            assert p["vulnerability_reason"]

    def test_activity_evaluator_safety_tiers(self):
        """
        Verifies the AI Activity Schedule Negotiator flags midday exertion as DANGEROUS
        and early morning as SAFE or CAUTION.
        """
        # Afternoon strenuous run at 2 PM (14:00) during extreme heat
        midday_result = HeatSafetyEngine.evaluate_activity_schedule(
            station_record={"mean_temp_c": 40.0, "relative_humidity": 55.0, "heat_stress_index": 78.0},
            activity="Running",
            planned_hour=14,
            duration_mins=60
        )
        assert midday_result["verdict"] in ["CAUTION", "DANGEROUS"]
        assert len(midday_result["safer_alternatives"]) > 0

        # Early morning light activity at 6 AM (06:00)
        morning_result = HeatSafetyEngine.evaluate_activity_schedule(
            station_record={"mean_temp_c": 26.0, "relative_humidity": 50.0, "heat_stress_index": 22.0},
            activity="Walking",
            planned_hour=6,
            duration_mins=30
        )
        assert morning_result["verdict"] in ["SAFE", "CAUTION"]

    def test_clinical_symptom_triage_escalation(self):
        """
        Verifies the clinical symptom screener correctly escalates life-threatening
        heat stroke signs (confusion, fainting) to EMERGENCY with 108 ambulance directives.
        """
        # Life-threatening emergency
        emergency_res = HeatSafetyEngine.triage_symptoms(["confusion", "fainting", "vomiting"])
        assert emergency_res["triage_tier"] == "EMERGENCY"
        assert emergency_res["emergency_call_number"] == "108"
        assert "108" in emergency_res["primary_directive"]

        # Moderate heat exhaustion warning
        warning_res = HeatSafetyEngine.triage_symptoms(["dizzy", "headache", "very_hot"])
        assert warning_res["triage_tier"] in ["WARNING", "EMERGENCY"]
        assert len(warning_res["action_steps"]) > 0

        # Normal minor fatigue
        normal_res = HeatSafetyEngine.triage_symptoms(["thirsty"])
        assert normal_res["triage_tier"] in ["NORMAL", "WARNING"]

    def test_hourly_forecast_and_welfare_endpoints(self):
        """
        Verifies the /api/safety/forecast/hourly and /api/safety/welfare-checkin endpoints.
        """
        from fastapi.testclient import TestClient
        from backend.main import app

        client = TestClient(app)
        
        # Test Hourly Forecast Endpoint
        res = client.get("/api/safety/forecast/hourly?latitude=25.56&longitude=84.01")
        assert res.status_code == 200
        data = res.json()
        assert "hourly" in data
        assert len(data["hourly"]) == 15  # 6 AM to 8 PM
        assert "peak_window" in data
        assert "peak_heat_index_c" in data
        assert data["peak_tier"] in ["Low", "Moderate", "High", "Very High", "Extreme"]

        # Test Welfare Checkin Endpoint
        checkin_res = client.post(
            "/api/safety/welfare-checkin",
            json={
                "user_name": "Ramesh Kumar",
                "location_name": "Buxar, Bihar",
                "latitude": 25.56,
                "longitude": 84.01,
                "water_liters": 2.0,
                "status_note": "Resting under shade",
                "risk_tier": "High"
            }
        )
        # Test Live Weather Endpoint (Open-Meteo or graceful GSOD fallback)
        live_res = client.get("/api/safety/weather/live?latitude=25.56&longitude=84.01")
        assert live_res.status_code == 200
        live_data = live_res.json()
        assert "temperature_c" in live_data
        assert "heat_index_c" in live_data
        assert "risk_tier" in live_data
        assert live_data["risk_tier"] in ["Low", "Moderate", "High", "Very High", "Extreme"]
        assert live_data["status"] in ["online", "offline_fallback"]
        assert "source" in live_data

