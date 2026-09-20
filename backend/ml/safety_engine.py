"""
HeatShield Public Safety Engine
Translates unsupervised ML biometeorological clusters and continuous HSI scores
into citizen-facing, lifesaving heat risk intelligence, persona-specific recommendations,
cooling center locations, and community assistance networks.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd

class HeatSafetyEngine:
    """
    Public safety intelligence engine translating environmental weather observations
    into actionable personal risk scores and civil defense precautions.
    """

    PERSONAS = [
        {
            "id": "child",
            "title": "Infant & Young Child",
            "icon": "Baby",
            "vulnerability_reason": "Children produce more metabolic heat per pound than adults and have less mature sweating mechanisms.",
            "low_advice": [
                "Ensure regular water intake during outdoor play.",
                "Dress in light-colored, breathable cotton clothing."
            ],
            "moderate_advice": [
                "Limit intense outdoor playground activities between 12:00 PM and 3:00 PM.",
                "Offer sips of water or breastmilk/formula every 30 minutes even if they do not ask.",
                "Never leave a child unattended inside a parked vehicle, even with windows cracked."
            ],
            "high_advice": [
                "Strictly avoid direct sunlight between 11:00 AM and 4:00 PM.",
                "Keep baby strollers shaded with breathable netting; avoid thick blankets that trap heat.",
                "Monitor for heat rash, excessive irritability, or lethargy."
            ],
            "extreme_advice": [
                "Keep children indoors in ventilated or air-cooled environments.",
                "Provide cool sponge baths if ambient temperature exceeds 40°C.",
                "Watch for sunken eyes, dry mouth, or absence of tears when crying (signs of severe dehydration)."
            ]
        },
        {
            "id": "elderly",
            "title": "Senior Citizen (65+)",
            "icon": "HeartHandshake",
            "vulnerability_reason": "Age-related decline in cardiovascular reserve, altered thirst sensation, and medication side effects increase heat vulnerability.",
            "low_advice": [
                "Maintain baseline hydration throughout the morning and afternoon.",
                "Keep living quarters adequately ventilated."
            ],
            "moderate_advice": [
                "Schedule market visits or walks before 9:00 AM or after 6:30 PM.",
                "Drink water regularly without waiting to feel thirsty.",
                "Review daily medications with a doctor (diuretics and beta-blockers impair heat response)."
            ],
            "high_advice": [
                "Remain indoors during midday peak thermal hours.",
                "Use fans with open windows or move to the coolest room in the residence.",
                "Arrange daily morning and evening wellness check-ins with family or neighbors."
            ],
            "extreme_advice": [
                "If home lacks AC and indoor temp exceeds 35°C, relocate to a nearby community cooling center.",
                "Place cool damp washcloths on forehead, neck, and wrists.",
                "Seek immediate medical help if experiencing confusion, dizziness, or chest tightness."
            ]
        },
        {
            "id": "outdoor_worker",
            "title": "Farmer & Agricultural Worker",
            "icon": "Tractor",
            "vulnerability_reason": "High metabolic workload combined with continuous direct solar radiation causes rapid core temperature escalation.",
            "low_advice": [
                "Carry at least 3 liters of fresh drinking water to the field.",
                "Wear a wide-brimmed straw hat or protective cotton gamchha/headscarf."
            ],
            "moderate_advice": [
                "Shift heavy plowing and manual harvesting to 5:30 AM – 9:30 AM.",
                "Take 10-minute shaded rest breaks every 60 minutes.",
                "Supplement water with lemon water, chaas (buttermilk), or oral rehydration salts (ORS)."
            ],
            "high_advice": [
                "Mandatory 20-minute shaded recovery for every 40 minutes of continuous field labor.",
                "Avoid working alone; use a buddy system to watch for disorientation or stumbling.",
                "Halt all field labor between 11:30 AM and 3:30 PM."
            ],
            "extreme_advice": [
                "Suspend non-emergency agricultural labor during red-flag thermal hours.",
                "Set up tarp-shaded recovery stations equipped with earthen water pots (matkas) and ORS.",
                "Immediately douse anyone displaying hot dry skin or confusion with water and transport to shade."
            ]
        },
        {
            "id": "delivery_worker",
            "title": "Delivery & Gig Rider",
            "icon": "Bike",
            "vulnerability_reason": "Prolonged exposure to tarmac surface radiation (50°C+), vehicle engine heat, and helmet heat trapping.",
            "low_advice": [
                "Carry an insulated water bottle on the bike/scooter.",
                "Wear UV-protective arm sleeves and light cotton innerwear."
            ],
            "moderate_advice": [
                "Take a 5-minute break in air-conditioned malls or shaded restaurants between delivery orders.",
                "Loosen helmet straps during stationary traffic light waiting periods.",
                "Drink small amounts of electrolyte water every 20 minutes."
            ],
            "high_advice": [
                "Wear a damp bandana under your helmet to cool carotid arteries.",
                "Decline or pause orders during peak afternoon heat (1:00 PM – 3:30 PM) if experiencing lightheadedness.",
                "Utilize delivery hub hydration stations provided by platform companies."
            ],
            "extreme_advice": [
                "Platform operators should waive delivery speed penalties during extreme heat emergency corridors.",
                "Seek immediate air-conditioned sanctuary if vision blurs or nausea occurs.",
                "Carry emergency glucose or ORS sachets at all times."
            ]
        },
        {
            "id": "construction_worker",
            "title": "Construction & Physical Laborer",
            "icon": "HardHat",
            "vulnerability_reason": "Reflective building materials (concrete, steel), mandatory protective gear (helmets, boots), and strenuous physical lifting.",
            "low_advice": [
                "Drink 1 glass of water every 30 minutes while working.",
                "Use shade canopies for ground-level masonry work."
            ],
            "moderate_advice": [
                "Enforce NIOSH work-rest cycles: 45 minutes work / 15 minutes shaded recovery.",
                "Site managers must provide chilled potable water and shaded rest shelters with misting fans.",
                "Shift high-altitude scaffolding and roofing tasks to early morning shifts."
            ],
            "high_advice": [
                "Increase rest cycle to 30 minutes work / 30 minutes shaded rest under direct sun.",
                "Prohibit working alone on rooftops, trenches, or enclosed metal structures.",
                "Rotate laborers frequently out of high-temperature zones."
            ],
            "extreme_advice": [
                "Stop all direct-sun heavy lifting and concrete pouring between 11:00 AM and 4:00 PM.",
                "Provide ice packs, wet towels, and emergency first-aid kits on site.",
                "Immediate protocol for heat collapse: move to shade, strip excess clothing, spray with water, fan vigorously, call emergency services."
            ]
        },
        {
            "id": "athlete",
            "title": "Runner & Active Individual",
            "icon": "Activity",
            "vulnerability_reason": "High internal metabolic heat generation (1000+ Watts) competes with external environment for heat dissipation.",
            "low_advice": [
                "Hydrate before, during, and after exercise.",
                "Wear breathable, moisture-wicking technical fabrics."
            ],
            "moderate_advice": [
                "Complete outdoor runs before 7:30 AM or after 7:00 PM.",
                "Reduce training pace by 10–15% to compensate for increased cardiac strain.",
                "Check urine color: pale yellow indicates adequate hydration; dark amber indicates dehydration."
            ],
            "high_advice": [
                "Move endurance workouts indoors to gyms or covered running tracks.",
                "Weigh yourself before and after workouts; drink 500 ml of fluid for every 0.5 kg of body mass lost.",
                "Avoid high-intensity interval training (HIIT) outdoors."
            ],
            "extreme_advice": [
                "Strictly cancel competitive marathons, outdoor sports tournaments, and athletic matches.",
                "Heat stroke can occur in healthy athletes within 30 minutes under severe wet-bulb conditions.",
                "Rest and recover in temperature-controlled environments."
            ]
        },
        {
            "id": "no_cooling",
            "title": "Resident without AC / Cool Roof",
            "icon": "Home",
            "vulnerability_reason": "Tin or uninsulated concrete roofs absorb intense solar radiation, turning indoor rooms into thermal ovens with night temperatures >32°C.",
            "low_advice": [
                "Open windows on opposite walls to create natural cross-breezes.",
                "Cover windows with light-colored curtains during sunny hours."
            ],
            "moderate_advice": [
                "Hang damp sheets in front of open windows or doorways to create evaporative cooling.",
                "Spend the hottest afternoon hours (12:00 PM – 4:00 PM) in public air-conditioned spaces (libraries, malls, temples).",
                "Sleep on ground-level floors or terraces where ventilation is superior."
            ],
            "high_advice": [
                "Apply lime-wash / white reflective coating (cool roof technique) to rooftop surfaces if feasible.",
                "Keep electric fans clean and place a bowl of ice or cold water in front of the fan airflow.",
                "Take multiple lukewarm or cool showers throughout the afternoon and before bedtime."
            ],
            "extreme_advice": [
                "Relocate to designated municipal cooling shelters during peak daytime thermal hours.",
                "Wet your clothing or sleep with a damp bedsheet under a fan to draw heat from your skin.",
                "Stay connected with community volunteers for drinking water supply."
            ]
        }
    ]

    # Curated Municipal Cooling Centers & Hydration Points Repository
    COOLING_CENTERS = {
        "42182099999": [  # New Delhi Safdarjung
            {"name": "Delhi Govt Community Cooling Center & Dispensary", "type": "cooling_shelter", "address": "Kidwai Nagar Community Hall, New Delhi", "hours": "9:00 AM – 7:00 PM", "distance_km": 1.2, "has_ac": True, "has_water": True, "has_meds": True},
            {"name": "DMRC Metro Station Shaded Concourse & Water Kiosk", "type": "transit_hub", "address": "INA Metro Station Gate 2, New Delhi", "hours": "6:00 AM – 11:00 PM", "distance_km": 0.8, "has_ac": True, "has_water": True, "has_meds": False},
            {"name": "Public Library & Cultural Reading Room", "type": "public_facility", "address": "Lodhi Estate Public Library, New Delhi", "hours": "8:30 AM – 8:00 PM", "distance_km": 2.1, "has_ac": True, "has_water": True, "has_meds": False},
            {"name": "NDMC Free Jal Seva Pyaau (Chilled Water)", "type": "water_point", "address": "Safdarjung Enclave Market Corner", "hours": "24 Hours", "distance_km": 0.5, "has_ac": False, "has_water": True, "has_meds": False},
            {"name": "Safdarjung Hospital Heat Emergency Ward", "type": "hospital", "address": "Ring Road, Safdarjung, New Delhi", "hours": "24 Hours Emergency", "distance_km": 1.5, "has_ac": True, "has_water": True, "has_meds": True}
        ],
        "43003099999": [  # Mumbai Santacruz
            {"name": "BMC Shaded Coastal Heat Refuge & Primary Health Center", "type": "cooling_shelter", "address": "Santacruz West Station Road, Mumbai", "hours": "8:00 AM – 8:00 PM", "distance_km": 0.9, "has_ac": True, "has_water": True, "has_meds": True},
            {"name": "Municipal Air-Conditioned Community Hall", "type": "public_facility", "address": "Juhu Lane, Andheri West, Mumbai", "hours": "9:00 AM – 6:00 PM", "distance_km": 2.4, "has_ac": True, "has_water": True, "has_meds": False},
            {"name": "BMC Drinking Water Kiosk & ORS Booth", "type": "water_point", "address": "Linking Road Junction, Bandra, Mumbai", "hours": "7:00 AM – 9:00 PM", "distance_km": 1.8, "has_ac": False, "has_water": True, "has_meds": True},
            {"name": "Cooper Municipal General Hospital - Heat Stroke Center", "type": "hospital", "address": "U10 J.P. Road, Vile Parle West, Mumbai", "hours": "24 Hours Emergency", "distance_km": 2.2, "has_ac": True, "has_water": True, "has_meds": True}
        ],
        "43279099999": [  # Chennai Meenambakkam
            {"name": "Greater Chennai Corporation Cooling Shelter", "type": "cooling_shelter", "address": "GST Road, Alandur, Chennai", "hours": "8:30 AM – 7:30 PM", "distance_km": 1.1, "has_ac": True, "has_water": True, "has_meds": True},
            {"name": "Metro Transit Cooling Hub & Thanneer Pandal", "type": "water_point", "address": "Chennai Airport Metro Concourse, Chennai", "hours": "6:00 AM – 11:00 PM", "distance_km": 0.6, "has_ac": True, "has_water": True, "has_meds": False},
            {"name": "Alandur Public Health Center - ORS Kiosk", "type": "public_facility", "address": "Bazaar Road, Alandur, Chennai", "hours": "9:00 AM – 5:00 PM", "distance_km": 1.4, "has_ac": True, "has_water": True, "has_meds": True},
            {"name": "Government Royapettah Hospital Thermal Stroke Wing", "type": "hospital", "address": "Royapettah High Road, Chennai", "hours": "24 Hours Emergency", "distance_km": 5.8, "has_ac": True, "has_water": True, "has_meds": True}
        ],
        "42809099999": [  # Kolkata Dum Dum
            {"name": "KMC Heat Relief & Hydration Center", "type": "cooling_shelter", "address": "Jessore Road, Dum Dum, Kolkata", "hours": "8:00 AM – 7:00 PM", "distance_km": 1.0, "has_ac": True, "has_water": True, "has_meds": True},
            {"name": "Dum Dum Metro Underground Cooling Sanctuary", "type": "transit_hub", "address": "Dum Dum Railway & Metro Station, Kolkata", "hours": "6:00 AM – 10:30 PM", "distance_km": 1.5, "has_ac": True, "has_water": True, "has_meds": False},
            {"name": "Free Jalchhatra (Cold Drinking Water Booth)", "type": "water_point", "address": "VIP Road Crossing, Kolkata", "hours": "8:00 AM – 8:00 PM", "distance_km": 0.7, "has_ac": False, "has_water": True, "has_meds": False},
            {"name": "RG Kar Medical College Emergency Heat Unit", "type": "hospital", "address": "1 Khudiram Bose Sarani, Kolkata", "hours": "24 Hours Emergency", "distance_km": 4.1, "has_ac": True, "has_water": True, "has_meds": True}
        ]
    }

    # In-memory Community Assistance Requests Store
    COMMUNITY_REQUESTS = [
        {
            "id": "req-101",
            "station_id": "42182099999",
            "location_name": "New Delhi - Kotla Mubarakpur",
            "beneficiary_type": "elderly",
            "urgency": "high",
            "title": "Elderly couple needs bottled water & ORS packets",
            "description": "Room on 3rd floor with tin roof reaching 43°C. Municipal water supply intermittent. Assistance requested with 20L water bottle delivery.",
            "timestamp": "18 mins ago",
            "status": "open",
            "volunteers_signed_up": 0,
            "contact_name": "Ramesh (Neighbor)",
            "distance_km": 1.4
        },
        {
            "id": "req-102",
            "station_id": "42182099999",
            "location_name": "New Delhi - Okhla Industrial Area",
            "beneficiary_type": "outdoor_worker",
            "urgency": "medium",
            "title": "Tarpaulin & shade net setup for rickshaw stand",
            "description": "40+ e-rickshaw drivers resting in direct sun between rides. Requesting volunteer help to erect shade netting and replenish earthen water matkas.",
            "timestamp": "42 mins ago",
            "status": "in_progress",
            "volunteers_signed_up": 2,
            "contact_name": "Pawan (Drivers Union)",
            "distance_km": 3.2
        },
        {
            "id": "req-103",
            "station_id": "43003099999",
            "location_name": "Mumbai - Dharavi 90ft Road",
            "beneficiary_type": "no_cooling",
            "urgency": "extreme",
            "title": "Fan repair & cool roof white coating for senior citizen residence",
            "description": "78-year-old grandmother living alone. Ceiling fan motor burnt out; indoor humidity 82%. Needs table fan and emergency hydration check.",
            "timestamp": "1 hour ago",
            "status": "open",
            "volunteers_signed_up": 0,
            "contact_name": "Sunita (Community Volunteer)",
            "distance_km": 2.1
        },
        {
            "id": "req-104",
            "station_id": "43279099999",
            "location_name": "Chennai - Guindy Industrial Estate",
            "beneficiary_type": "delivery_worker",
            "urgency": "medium",
            "title": "Electrolyte and cold water refill point setup",
            "description": "Setting up volunteer Thanneer Pandal (water booth) near metro pillar 124 for delivery riders during 12-4 PM.",
            "timestamp": "2 hours ago",
            "status": "completed",
            "volunteers_signed_up": 3,
            "contact_name": "Karthik R.",
            "distance_km": 1.9
        }
    ]

    @classmethod
    def get_citizen_risk_assessment(
        cls,
        station_record: Dict[str, Any],
        profile_record: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Translates station biometeorological observations into citizen safety scores,
        level categories, thermodynamic hazard explanations, and persona advice.
        """
        temp = float(station_record.get("mean_temp_c", 35.0))
        max_temp = float(station_record.get("max_temp_c", temp + 5.0))
        dewp = float(station_record.get("dew_point_c", 20.0))
        rh = float(station_record.get("relative_humidity", 50.0))

        if "heat_index_c" in station_record:
            hi = float(station_record["heat_index_c"])
        else:
            # Rothfusz Heat Index calculation
            t_f = temp * 9.0 / 5.0 + 32.0
            if t_f < 80.0:
                hi_f = 0.5 * (t_f + 61.0 + ((t_f - 68.0) * 1.2) + (rh * 0.094))
            else:
                hi_f = (
                    -42.379 + 2.04901523 * t_f + 10.14333127 * rh
                    - 0.22475541 * t_f * rh - 0.00683783 * (t_f ** 2)
                    - 0.05481717 * (rh ** 2) + 0.00122874 * (t_f ** 2) * rh
                    + 0.00085282 * t_f * (rh ** 2) - 0.00000199 * (t_f ** 2) * (rh ** 2)
                )
            hi = round((hi_f - 32.0) * 5.0 / 9.0, 1)

        if "heat_stress_index" in station_record:
            hsi = float(station_record["heat_stress_index"])
        else:
            # Continuous Heat Stress Index (HSI: 0 to 100)
            raw_hsi = 2.0 * (hi - 22.0) + (temp - 25.0) * 0.5
            wind_kmh = float(station_record.get("wind_speed_kmh", 10.0))
            if wind_kmh > 15.0 and temp < 42.0:
                raw_hsi -= min(8.0, (wind_kmh - 15.0) * 0.35)
            hsi = float(np.clip(raw_hsi, 5.0, 99.0))

        station_name = str(station_record.get("NAME", station_record.get("name", "Unknown Location")))
        station_id = str(station_record.get("STATION", station_record.get("station_id", "")))

        # 1. Citizen Heat Risk Score (0 to 100)
        risk_score = int(np.clip(round(hsi), 5, 99))
        
        # 2. 5-Tier Classification
        if risk_score <= 25:
            tier_name = "Low Risk"
            tier_badge = "LOW"
            color = "#10B981"  # Emerald
            bg_light = "bg-emerald-500/10"
            border_color = "border-emerald-500/30"
            summary_headline = "Mild to moderate seasonal warmth. General outdoor activities are safe with standard hydration."
            urgency_level = "normal"
        elif risk_score <= 50:
            tier_name = "Moderate Risk"
            tier_badge = "MODERATE"
            color = "#F59E0B"  # Amber
            bg_light = "bg-amber-500/10"
            border_color = "border-amber-500/30"
            summary_headline = "Noticeable thermal discomfort. Vulnerable individuals should begin taking hydration precautions."
            urgency_level = "caution"
        elif risk_score <= 75:
            tier_name = "High Risk"
            tier_badge = "HIGH"
            color = "#F97316"  # Orange
            bg_light = "bg-orange-500/10"
            border_color = "border-orange-500/30"
            summary_headline = "Dangerous heat stress levels. Heat cramps and exhaustion probable during prolonged exposure."
            urgency_level = "warning"
        elif risk_score <= 90:
            tier_name = "Very High Risk"
            tier_badge = "VERY HIGH"
            color = "#EF4444"  # Red
            bg_light = "bg-red-500/10"
            border_color = "border-red-500/30"
            summary_headline = "Severe heat hazard. Sunstroke and heat cramps likely. Strenuous outdoor labor must be curtailed."
            urgency_level = "alert"
        else:
            tier_name = "Extreme Risk"
            tier_badge = "EXTREME"
            color = "#7C3AED"  # Purple
            bg_light = "bg-purple-500/10"
            border_color = "border-purple-500/30"
            summary_headline = "Potentially lethal heat emergency. Heatstroke imminent with prolonged physical exertion."
            urgency_level = "emergency"

        # 3. Plain-Language "Why It's Dangerous Right Now"
        reasons = []
        if rh > 65.0 and hi > 42.0:
            reasons.append(
                f"High humidity ({rh:.0f}%) prevents your body from cooling through evaporative sweating, creating a dangerous wet-bulb heat trap."
            )
        elif max_temp >= 42.0:
            reasons.append(
                f"Peak daytime air temperature ({max_temp:.1f}°C) causes rapid thermal shock and intense fluid loss through direct radiant heating."
            )
        
        if dewp >= 24.0:
            reasons.append(
                f"Elevated atmospheric dew point ({dewp:.1f}°C) severely suppresses the skin's cooling rate even when resting in the shade."
            )

        if float(station_record.get("temperature_range", 10.0)) < 7.0 and temp > 30.0:
            reasons.append(
                "Minimal nighttime temperature drop denies the human body crucial nocturnal thermal recovery."
            )

        if not reasons:
            reasons.append(
                f"Combined ambient temperature ({temp:.1f}°C) and apparent heat index ({hi:.1f}°C) elevate cardiac workload."
            )

        danger_explanation = " ".join(reasons)

        # 4. Immediate Citizen Action Checklist
        if risk_score <= 25:
            immediate_actions = [
                {"id": "act-1", "text": "Drink at least 2 to 2.5 liters of water throughout the day.", "done": False},
                {"id": "act-2", "text": "Wear light-colored, breathable cotton clothing.", "done": False},
                {"id": "act-3", "text": "Protect your eyes and skin with sunglasses or a hat outdoors.", "done": False}
            ]
        elif risk_score <= 50:
            immediate_actions = [
                {"id": "act-1", "text": "Drink water every 45 minutes even without thirst sensation.", "done": False},
                {"id": "act-2", "text": "Avoid continuous strenuous exertion under direct midday sun (12 PM – 3 PM).", "done": False},
                {"id": "act-3", "text": "Check in on elderly relatives or neighbors living alone.", "done": False},
                {"id": "act-4", "text": "Keep pets in shaded areas with ample fresh drinking water.", "done": False}
            ]
        elif risk_score <= 75:
            immediate_actions = [
                {"id": "act-1", "text": "Reschedule outdoor labor, jogging, or workouts to early morning (before 9 AM).", "done": False},
                {"id": "act-2", "text": "Drink 1 glass of water or electrolyte solution every 20–30 minutes.", "done": False},
                {"id": "act-3", "text": "Stay in shaded or air-conditioned environments between 11:30 AM and 4:00 PM.", "done": False},
                {"id": "act-4", "text": "Carry an umbrella, wide-brim hat, or wet cotton cloth for outdoor transit.", "done": False},
                {"id": "act-5", "text": "Never leave infants, children, or pets in a stationary vehicle.", "done": False}
            ]
        elif risk_score <= 90:
            immediate_actions = [
                {"id": "act-1", "text": "STAY INDOORS in ventilated or cooled spaces between 11:00 AM and 4:30 PM.", "done": False},
                {"id": "act-2", "text": "Halt or suspend heavy manual labor; enforce mandatory 20-min shaded rest breaks.", "done": False},
                {"id": "act-3", "text": "Drink 3 to 4 liters of fluid; consume oral rehydration salts (ORS), lemon water, or chaas.", "done": False},
                {"id": "act-4", "text": "If residence lacks cooling, locate your nearest municipal air-conditioned cooling shelter.", "done": False},
                {"id": "act-5", "text": "Apply cool damp cloths to neck, armpits, and groin if body feels excessively hot.", "done": False}
            ]
        else:  # Extreme Risk
            immediate_actions = [
                {"id": "act-1", "text": "EMERGENCY: Halt all non-essential outdoor activity immediately.", "done": False},
                {"id": "act-2", "text": "Relocate vulnerable family members (infants, elderly) to air-conditioned cooling centers.", "done": False},
                {"id": "act-3", "text": "Hydrate continuously with electrolyte fluids; avoid alcohol, tea, and sugary sodas.", "done": False},
                {"id": "act-4", "text": "Keep curtains closed against direct radiant solar heat on south/west windows.", "done": False},
                {"id": "act-5", "text": "Watch for emergency symptoms: confusion, fainting, cessation of sweating, vomiting.", "done": False},
                {"id": "act-6", "text": "If someone collapses, move to shade, spray cold water, fan vigorously, and call 108 / 112 immediately.", "done": False}
            ]

        # 5. Persona-Specific Tailored Recommendations
        persona_advice = []
        for p in cls.PERSONAS:
            if risk_score <= 25:
                advice_list = p["low_advice"]
            elif risk_score <= 50:
                advice_list = p["moderate_advice"]
            elif risk_score <= 75:
                advice_list = p["high_advice"]
            else:
                advice_list = p["extreme_advice"]

            persona_advice.append({
                "persona_id": p["id"],
                "title": p["title"],
                "icon": p["icon"],
                "vulnerability_reason": p["vulnerability_reason"],
                "tailored_steps": advice_list
            })

        # 6. Peak Danger Window
        peak_danger = "11:30 AM – 4:00 PM" if risk_score >= 60 else "12:30 PM – 3:00 PM"

        return {
            "station_id": station_id,
            "station_name": station_name,
            "latitude": float(station_record.get("LATITUDE", station_record.get("latitude", 0.0))),
            "longitude": float(station_record.get("LONGITUDE", station_record.get("longitude", 0.0))),
            "heat_risk_score": risk_score,
            "tier_name": tier_name,
            "tier_badge": tier_badge,
            "urgency_level": urgency_level,
            "color": color,
            "bg_light": bg_light,
            "border_color": border_color,
            "summary_headline": summary_headline,
            "danger_explanation": danger_explanation,
            "peak_danger_window": peak_danger,
            "current_weather": {
                "temperature_c": round(temp, 1),
                "max_temperature_c": round(max_temp, 1),
                "dew_point_c": round(dewp, 1),
                "relative_humidity_pct": round(rh, 1),
                "heat_index_c": round(hi, 1),
                "wind_speed_kmh": round(float(station_record.get("wind_speed_kmh", 10.0)), 1)
            },
            "immediate_actions": immediate_actions,
            "persona_advice": persona_advice,
            "emergency_numbers": [
                {"label": "Ambulance / Medical Emergency", "number": "108"},
                {"label": "National Emergency Helpline", "number": "112"},
                {"label": "Disaster Management Authority", "number": "1078"}
            ]
        }

    @classmethod
    def get_cooling_centers_for_station(cls, station_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves verified municipal cooling shelters, hydration points, and hospitals.
        Falls back to regional defaults if station has no exact entry.
        """
        if station_id in cls.COOLING_CENTERS:
            return cls.COOLING_CENTERS[station_id]

        return [
            {
                "name": "District Red Cross Heat Shelter & Hydration Hub",
                "type": "cooling_shelter",
                "address": "Civil Lines, Near Collectorate Office",
                "hours": "9:00 AM – 7:30 PM",
                "distance_km": 1.5,
                "has_ac": True,
                "has_water": True,
                "has_meds": True
            },
            {
                "name": "Central Bus Stand Air-Cooled Passenger Concourse",
                "type": "transit_hub",
                "address": "Main Transport Terminus",
                "hours": "24 Hours",
                "distance_km": 1.2,
                "has_ac": True,
                "has_water": True,
                "has_meds": False
            },
            {
                "name": "Municipal Pyaau (Free Chilled Water Station)",
                "type": "water_point",
                "address": "Clock Tower Market Square",
                "hours": "7:00 AM – 9:00 PM",
                "distance_km": 0.8,
                "has_ac": False,
                "has_water": True,
                "has_meds": False
            },
            {
                "name": "District Civil Hospital - Heat Emergency Unit",
                "type": "hospital",
                "address": "Hospital Road, Civil Lines",
                "hours": "24 Hours Emergency",
                "distance_km": 2.6,
                "has_ac": True,
                "has_water": True,
                "has_meds": True
            }
        ]

    @classmethod
    def get_community_requests(cls, station_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Returns active community assistance requests, optionally filtered by station.
        """
        if not station_id:
            return cls.COMMUNITY_REQUESTS
        filtered = [r for r in cls.COMMUNITY_REQUESTS if r.get("station_id") == station_id]
        return filtered if filtered else cls.COMMUNITY_REQUESTS

    @classmethod
    def add_community_request(cls, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Adds a new community heat assistance request.
        """
        new_id = f"req-{len(cls.COMMUNITY_REQUESTS) + 101}"
        new_req = {
            "id": new_id,
            "station_id": str(request_data.get("station_id", "42182099999")),
            "location_name": str(request_data.get("location_name", "Local Neighborhood")),
            "beneficiary_type": str(request_data.get("beneficiary_type", "elderly")),
            "urgency": str(request_data.get("urgency", "high")),
            "title": str(request_data.get("title", "Heat Assistance Request")),
            "description": str(request_data.get("description", "Needs urgent hydration or cooling support.")),
            "timestamp": "Just now",
            "status": "open",
            "volunteers_signed_up": 0,
            "contact_name": str(request_data.get("contact_name", "Community Member")),
            "distance_km": round(float(request_data.get("distance_km", 1.0)), 1)
        }
        cls.COMMUNITY_REQUESTS.insert(0, new_req)
        return new_req

    @classmethod
    def respond_to_request(cls, request_id: str) -> Optional[Dict[str, Any]]:
        """
        Increments volunteer sign-up on a community request.
        """
        for req in cls.COMMUNITY_REQUESTS:
            if req["id"] == request_id:
                req["volunteers_signed_up"] += 1
                if req["status"] == "open":
                    req["status"] = "in_progress"
                return req
        return None

    @classmethod
    def generate_daily_heat_brief(cls, station_record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates the morning 'Daily Heat Brief' for citizens.
        """
        temp = float(station_record.get("mean_temp_c", 35.0))
        max_t = float(station_record.get("max_temp_c", temp + 5.0))
        rh = float(station_record.get("relative_humidity", 50.0))
        hi = float(station_record.get("heat_index_c", temp + 3.0))
        hsi = float(station_record.get("heat_stress_index", 50.0))
        st_name = str(station_record.get("NAME", station_record.get("name", "Local Area")))

        if hsi >= 75:
            trend_summary = "Today will be significantly more oppressive than average. Severe heat hazard in effect."
            best_window = "6:00 AM – 8:30 AM"
            avoid_window = "11:30 AM – 4:30 PM"
            target_liters = 3.5
        elif hsi >= 50:
            trend_summary = "Noticeable midday heat peak expected today. Hydration precautions advised."
            best_window = "6:30 AM – 9:30 AM or after 6:30 PM"
            avoid_window = "12:30 PM – 3:30 PM"
            target_liters = 2.5
        else:
            trend_summary = "Moderate seasonal conditions. Comfortable morning and evening hours."
            best_window = "Any time before 11:00 AM or after 5:00 PM"
            avoid_window = "1:00 PM – 3:00 PM"
            target_liters = 2.0

        return {
            "station_name": st_name,
            "headline": f"Daily Heat Brief for {st_name.split(',')[0]}",
            "trend_summary": trend_summary,
            "peak_risk_window": avoid_window,
            "best_outdoor_window": best_window,
            "max_temperature_c": round(max_t, 1),
            "humidity_pct": round(rh, 1),
            "feels_like_c": round(hi, 1),
            "target_hydration_liters": target_liters,
            "morning_reminder": "Drink 2 full glasses of water before leaving home. Reapply sunscreen and carry an umbrella."
        }

    @classmethod
    def evaluate_activity_schedule(
        cls,
        station_record: Dict[str, Any],
        activity: str,
        planned_hour: int,
        duration_mins: int = 45
    ) -> Dict[str, Any]:
        """
        AI Schedule Negotiator: evaluates heat risk for a planned activity and proposes safer alternative slots.
        """
        temp = float(station_record.get("mean_temp_c", 35.0))
        max_t = float(station_record.get("max_temp_c", temp + 5.0))
        hsi = float(station_record.get("heat_stress_index", 50.0))

        # Diurnal thermal curve approximation (peak around 14:00)
        hour_rad = ((planned_hour - 6) / 18.0) * np.pi
        diurnal_factor = max(0.0, np.sin(hour_rad)) if 6 <= planned_hour <= 22 else 0.1
        hour_temp = temp + (max_t - temp) * diurnal_factor

        is_peak_danger = (11 <= planned_hour <= 16)
        is_moderate_danger = (10 <= planned_hour < 11 or 16 < planned_hour <= 18)

        act_clean = activity.lower().strip()
        is_strenuous = any(k in act_clean for k in ["run", "jog", "cricket", "football", "workout", "construction", "labor"])

        if is_peak_danger and (hsi > 50 or is_strenuous):
            verdict = "DANGEROUS"
            color = "#EF4444"
            badge = "HIGH EXPOSURE HAZARD"
            explanation = f"Planning '{activity}' at {planned_hour:02d}:00 overlaps directly with the day's peak solar and thermal window (simulated {hour_temp:.1f}°C). Cardiac and dehydration strain are extreme."
            safer_alternatives = [
                {"slot": "06:30 AM – 08:00 AM", "expected_temp": f"{temp - 4:.1f}°C", "rating": "Optimal (Low Thermal Strain)"},
                {"slot": "07:00 PM – 08:30 PM", "expected_temp": f"{temp - 1:.1f}°C", "rating": "Safer (Post-Sunset Recovery)"}
            ]
            recommended_action = f"Reschedule '{activity}' to early morning (before 8:30 AM) or after sunset."
        elif is_moderate_danger:
            verdict = "CAUTION"
            color = "#F59E0B"
            badge = "MODERATE HEAT STRAIN"
            explanation = f"Conditions at {planned_hour:02d}:00 are moderately warm ({hour_temp:.1f}°C). Manageable if hydration and shade are maintained."
            safer_alternatives = [
                {"slot": "07:00 AM – 08:30 AM", "expected_temp": f"{temp - 3:.1f}°C", "rating": "Cooler & Safer"}
            ]
            recommended_action = "Carry at least 750ml of electrolyte fluid and take 5-minute shaded breaks every 20 minutes."
        else:
            verdict = "SAFE"
            color = "#10B981"
            badge = "SAFE WINDOW"
            explanation = f"{planned_hour:02d}:00 falls within a favorable diurnal window (approx {hour_temp:.1f}°C). Solar radiation is minimal."
            safer_alternatives = []
            recommended_action = "Safe to proceed. Maintain normal hydration."

        return {
            "activity": activity,
            "planned_time": f"{planned_hour:02d}:00",
            "duration_mins": duration_mins,
            "verdict": verdict,
            "badge": badge,
            "color": color,
            "explanation": explanation,
            "recommended_action": recommended_action,
            "safer_alternatives": safer_alternatives
        }

    @classmethod
    def triage_symptoms(cls, symptoms: List[str]) -> Dict[str, Any]:
        """
        Evaluates citizen-reported symptoms and provides triage instructions.
        """
        sym_set = set(s.lower() for s in symptoms)

        # Red flags: Medical emergency
        if any(s in sym_set for s in ["confused_faint", "confusion", "fainting", "vomiting", "seizure", "no_sweating"]):
            return {
                "triage_tier": "EMERGENCY",
                "badge": "🚨 IMMEDIATE MEDICAL ALERT",
                "color": "#DC2626",
                "urgency": "critical",
                "primary_directive": "Potential Heat Stroke! Call 108 immediately.",
                "action_steps": [
                    "Move person into air-conditioned room or dense shade immediately.",
                    "Strip outer clothing and spray/sponge body with cold water.",
                    "Fan vigorously to accelerate evaporative heat loss.",
                    "Place ice packs or cold wet towels on neck, armpits, and groin.",
                    "DO NOT give liquids if the person is semi-conscious or vomiting."
                ],
                "emergency_call_number": "108"
            }

        # Moderate symptoms: Heat exhaustion
        if any(s in sym_set for s in ["dizzy", "headache", "very_hot", "cramps"]):
            return {
                "triage_tier": "WARNING",
                "badge": "⚠️ HEAT EXHAUSTION WARNING",
                "color": "#F97316",
                "urgency": "high",
                "primary_directive": "Stop all exertion immediately. Rest in cool shade and rehydrate.",
                "action_steps": [
                    "Stop moving; sit or lie down in an air-conditioned room or breezy shade.",
                    "Sip cool water mixed with Oral Rehydration Salts (ORS) or electrolyte powder.",
                    "Elevate feet slightly to promote cardiovascular venous return.",
                    "Loosen tight clothing and mist face with water.",
                    "If dizziness or headache does not improve within 30 minutes, seek a clinic."
                ],
                "emergency_call_number": "108"
            }

        # Mild symptoms or fine
        return {
            "triage_tier": "NORMAL",
            "badge": "✅ STABLE / MILD STRAIN",
            "color": "#10B981",
            "urgency": "low",
            "primary_directive": "Body is handling thermal conditions normally. Maintain baseline hydration.",
            "action_steps": [
                "Drink 1 glass of fresh water.",
                "Take a 10-minute rest break if working outdoors.",
                "Continue monitoring for signs of fatigue."
            ],
            "emergency_call_number": "108"
        }

    @classmethod
    def get_family_heat_status(
        cls,
        family_members: List[Dict[str, Any]],
        all_stations_df: Optional[pd.DataFrame] = None
    ) -> List[Dict[str, Any]]:
        """
        Returns heat risk overview for a list of family members in different cities.
        """
        results = []
        for member in family_members:
            st_id = str(member.get("station_id", "42182099999"))
            name = str(member.get("name", "Family Member"))
            rel = str(member.get("relationship", "Relative"))

            # Default station info
            temp = 37.0
            hi = 44.0
            rh = 55.0
            hsi = 65.0
            city_name = "New Delhi"

            if all_stations_df is not None and len(all_stations_df) > 0:
                match = all_stations_df[all_stations_df["STATION"].astype(str) == st_id]
                if len(match) > 0:
                    rec = match.iloc[-1]
                    temp = float(rec.get("mean_temp_c", 35.0))
                    hi = float(rec.get("heat_index_c", temp + 4.0))
                    rh = float(rec.get("relative_humidity", 50.0))
                    hsi = float(rec.get("heat_stress_index", 50.0))
                    city_name = str(rec.get("NAME", "Unknown")).split(",")[0]

            risk_score = int(np.clip(round(hsi), 10, 98))
            if risk_score >= 85:
                tier = "Extreme"
                badge_color = "#7C3AED"
                status_note = "Extreme risk: Check in immediately."
                needs_attention = True
            elif risk_score >= 70:
                tier = "Very High"
                badge_color = "#EF4444"
                status_note = "Dangerous afternoon heat. Remind to stay indoors."
                needs_attention = True
            elif risk_score >= 50:
                tier = "High"
                badge_color = "#F97316"
                status_note = "Moderate to high heat. Ensure hydration."
                needs_attention = False
            else:
                tier = "Moderate"
                badge_color = "#F59E0B"
                status_note = "Normal seasonal warmth."
                needs_attention = False

            results.append({
                "id": str(member.get("id", f"fam-{len(results)+1}")),
                "name": name,
                "relationship": rel,
                "station_id": st_id,
                "city_name": city_name,
                "phone_number": member.get("phone_number"),
                "heat_risk_score": risk_score,
                "tier": tier,
                "badge_color": badge_color,
                "temperature_c": round(temp, 1),
                "feels_like_c": round(hi, 1),
                "humidity_pct": round(rh, 1),
                "status_note": status_note,
                "needs_attention": needs_attention
            })
        return results

    @classmethod
    def query_heat_assistant(
        cls,
        query: str,
        station_record: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        AI Heat Assistant chatbot grounded in deterministic station biometeorological data.
        """
        q = query.strip().lower()
        temp = float(station_record.get("mean_temp_c", 35.0))
        max_t = float(station_record.get("max_temp_c", temp + 5.0))
        rh = float(station_record.get("relative_humidity", 50.0))
        hi = float(station_record.get("heat_index_c", temp + 3.0))
        hsi = float(station_record.get("heat_stress_index", 50.0))
        city = str(station_record.get("NAME", "Your Area")).split(",")[0]

        # 1. Cricket / Sports / Playing outside
        if any(k in q for k in ["cricket", "play", "football", "badminton", "sports", "match"]):
            if "2 pm" in q or "1 pm" in q or "3 pm" in q or "afternoon" in q or "12" in q:
                return {
                    "query": query,
                    "answer": f"🔴 Not recommended today in {city}. Between 12:00 PM and 4:00 PM, temperatures will reach {max_t:.1f}°C with a heat index of {hi:.1f}°C. Intense outdoor cardio during this window carries an acute risk of heat exhaustion and cramps. If possible, schedule your match after 6:30 PM or before 8:30 AM, and take frequent hydration timeouts.",
                    "risk_tier": "High",
                    "action_suggestion": "Move play to after 6:30 PM"
                }
            return {
                "query": query,
                "answer": f"Outdoor sports in {city} are manageable in the early morning (6:00–8:30 AM) or after 6:30 PM. Drink 500ml of electrolyte water 30 minutes before starting, and mandate a 5-minute shade break every 25 minutes.",
                "risk_tier": "Moderate",
                "action_suggestion": "Hydrate every 25 minutes"
            }

        # 2. Outdoor work / Manual labor
        if any(k in q for k in ["work outside", "field", "construction", "labor", "hours outside"]):
            return {
                "query": query,
                "answer": f"⚠️ If working outdoors in {city} today, your shift overlaps with elevated thermal conditions ({max_t:.1f}°C peak, {rh:.0f}% humidity). Per NIOSH occupational standards, take a mandatory 15-minute shaded rest break for every 45 minutes of labor. Keep an earthen pot (matka) of cool water nearby and wear a protective cotton head covering.",
                "risk_tier": "Very High" if hsi > 70 else "High",
                "action_suggestion": "Follow 45 min work / 15 min rest cycle"
            }

        # 3. Running / Jogging / Walking
        if any(k in q for k in ["run", "jog", "walk", "exercise"]):
            return {
                "query": query,
                "answer": f"For running in {city}, avoid the midday hours completely. The optimal running window today is 6:00 AM – 7:30 AM when ambient temperature is around {temp - 4:.1f}°C. If running in the evening, wait until after 7:30 PM when surface tarmac heat has radiated away.",
                "risk_tier": "Moderate",
                "action_suggestion": "Run before 7:30 AM"
            }

        # 4. Night heat / Sleeping / Feeling sticky
        if any(k in q for k in ["night", "sleep", "sticky", "fan", "ac", "evening"]):
            return {
                "query": query,
                "answer": f"Tonight in {city}, humidity is around {rh:.0f}% with minimal nocturnal cooling. To stay cool without high AC bills: hang a damp cotton bedsheet in front of an open window or fan, drink a glass of water before sleeping, and sleep on a lower floor or ventilated terrace.",
                "risk_tier": "Moderate",
                "action_suggestion": "Use evaporative damp sheet technique"
            }

        # Default fallback
        return {
            "query": query,
            "answer": f"Currently in {city}, the ambient temperature is {temp:.1f}°C with a heat index of {hi:.1f}°C and {rh:.0f}% relative humidity. Peak danger occurs between 12:00 PM and 4:00 PM. Keep hydrated, avoid direct sun exposure during peak hours, and check on elderly family members.",
            "risk_tier": "High" if hsi > 60 else "Moderate",
            "action_suggestion": "Avoid peak sun (12 PM - 4 PM)"
        }

    @classmethod
    def get_localization_dictionary(cls) -> Dict[str, Any]:
        """
        Returns multilingual translation strings for English, Hindi (हिन्दी), and Punjabi (ਪੰਜਾਬੀ).
        """
        return {
            "en": {
                "app_title": "HeatShield",
                "tagline": "AI-Powered Heat Safety for Everyone",
                "heat_risk": "Heat Risk",
                "feels_like": "Feels like",
                "peak_risk": "Peak Risk",
                "daily_brief": "Daily Heat Brief",
                "what_to_do": "What to do right now",
                "emergency_sos": "Heat Emergency SOS",
                "call_ambulance": "Call 108 Ambulance",
                "worker_mode": "Worker Mode",
                "family_care": "People I Care About",
                "cooling_centers": "Cooling Centers & Water",
                "ai_assistant": "AI Heat Assistant",
                "how_are_you_feeling": "How are you feeling?",
                "fine": "Fine 🙂",
                "tired": "Tired 😓",
                "very_hot": "Very Hot 🥵",
                "dizzy": "Dizzy 🤢",
                "headache": "Headache 🤕",
                "confused": "Confused / Faint 🚨",
                "water": "WATER",
                "shade": "SHADE",
                "break": "BREAK",
                "protection": "PROTECTION"
            },
            "hi": {
                "app_title": "हीटशील्ड",
                "tagline": "सभी के लिए एआई-संचालित हीट सुरक्षा",
                "heat_risk": "गर्मी का जोखिम",
                "feels_like": "महसूस तापमान",
                "peak_risk": "सर्वाधिक जोखिम समय",
                "daily_brief": "दैनिक हीट ब्रीफ",
                "what_to_do": "अभी क्या करें",
                "emergency_sos": "हीट इमरजेंसी एसओएस",
                "call_ambulance": "108 एम्बुलेंस को कॉल करें",
                "worker_mode": "श्रमिक मोड",
                "family_care": "मेरे अपने लोग",
                "cooling_centers": "शीतल केंद्र एवं प्याऊ",
                "ai_assistant": "एआई हीट सहायक",
                "how_are_you_feeling": "आप कैसा महसूस कर रहे हैं?",
                "fine": "ठीक हूँ 🙂",
                "tired": "थका हुआ 😓",
                "very_hot": "बहुत गर्मी 🥵",
                "dizzy": "चक्कर आ रहे हैं 🤢",
                "headache": "सिरदर्द 🤕",
                "confused": "बेहोशी / भ्रम 🚨",
                "water": "पानी",
                "shade": "छांव",
                "break": "विश्राम",
                "protection": "सुरक्षा"
            },
            "pa": {
                "app_title": "ਹੀਟਸ਼ੀਲਡ",
                "tagline": "ਸਾਰਿਆਂ ਲਈ ਏਆਈ ਹੀਟ ਸੁਰੱਖਿਆ",
                "heat_risk": "ਗਰਮੀ ਦਾ ਖ਼ਤਰਾ",
                "feels_like": "ਮਹਿਸੂਸ ਹੋਣ ਵਾਲਾ ਤਾਪਮਾਨ",
                "peak_risk": "ਸਭ ਤੋਂ ਖ਼ਤਰਨਾਕ ਸਮਾਂ",
                "daily_brief": "ਰੋਜ਼ਾਨਾ ਹੀਟ ਬ੍ਰੀਫ",
                "what_to_do": "ਹੁਣ ਕੀ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ",
                "emergency_sos": "ਹੀਟ ਐਮਰਜੈਂਸੀ ਐਸਓਐਸ",
                "call_ambulance": "108 ਐਂਬੂਲੈਂਸ ਕਾਲ ਕਰੋ",
                "worker_mode": "ਮਜ਼ਦੂਰ ਮੋਡ",
                "family_care": "ਮੇਰੇ ਆਪਣੇ",
                "cooling_centers": "ਠੰਢੇ ਕੇਂਦਰ ਅਤੇ ਪਿਆਊ",
                "ai_assistant": "ਏਆਈ ਹੀਟ ਸਹਾਇਕ",
                "how_are_you_feeling": "ਤੁਸੀਂ ਕਿਵੇਂ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ?",
                "fine": "ਠੀਕ ਹਾਂ 🙂",
                "tired": "ਥੱਕਿਆ ਹੋਇਆ 😓",
                "very_hot": "ਬਹੁਤ ਗਰਮੀ 🥵",
                "dizzy": "ਚੱਕਰ ਆ ਰਹੇ ਹਨ 🤢",
                "headache": "ਸਿਰਦਰਦ 🤕",
                "confused": "ਬੇਹੋਸ਼ੀ / ਭੁਲੇਖਾ 🚨",
                "water": "ਪਾਣੀ",
                "shade": "ਛਾਂ",
                "break": "ਆਰਾਮ",
                "protection": "ਬਚਾਅ"
            }
        }

    @classmethod
    def find_nearest_station(
        cls,
        user_lat: float,
        user_lon: float,
        df: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Calculates Haversine geodesic distance from user's live GPS coordinates
        to all stations in the dataset and returns the closest station with full risk assessment.
        """
        if df is None or len(df) == 0:
            raise ValueError("Dataset is empty.")

        # Aggregate unique stations with coordinates
        unique_stations = df.drop_duplicates(subset=["STATION"]).copy()

        def haversine_km(lat1, lon1, lat2, lon2):
            R = 6371.0  # Earth's radius in km
            dlat = np.radians(lat2 - lat1)
            dlon = np.radians(lon2 - lon1)
            a = np.sin(dlat / 2.0)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2.0)**2
            c = 2.0 * np.arcsin(np.sqrt(np.clip(a, 0.0, 1.0)))
            return R * c

        st_lats = unique_stations["LATITUDE"].values
        st_lons = unique_stations["LONGITUDE"].values
        distances = haversine_km(user_lat, user_lon, st_lats, st_lons)

        min_idx = int(np.argmin(distances))
        nearest_row = unique_stations.iloc[min_idx]
        nearest_st_id = str(nearest_row["STATION"])
        min_dist = float(distances[min_idx])

        # Get latest observation for that station
        station_history = df[df["STATION"].astype(str) == nearest_st_id]
        station_rec = station_history.iloc[-1].to_dict() if len(station_history) > 0 else nearest_row.to_dict()

        assessment = cls.get_citizen_risk_assessment(station_rec)

        return {
            "nearest_station_id": nearest_st_id,
            "nearest_station_name": str(station_rec.get("NAME", "Regional Station")),
            "distance_km": round(min_dist, 1),
            "user_coordinates": {"latitude": round(user_lat, 4), "longitude": round(user_lon, 4)},
            "station_coordinates": {
                "latitude": round(float(station_rec.get("LATITUDE", user_lat)), 4),
                "longitude": round(float(station_rec.get("LONGITUDE", user_lon)), 4)
            },
            "risk_assessment": assessment,
            "is_live_gps": True
        }

    @classmethod
    def predict_location_heat_risk(
        cls,
        user_lat: float,
        user_lon: float,
        df: pd.DataFrame,
        accuracy_m: Optional[float] = 18.0,
        mode: str = "online",
        k: int = 4,
        p: float = 2.0,
        profiles_list: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Predicts location-specific heat risk using Multi-Station Inverse Distance Weighting (IDW)
        spatial interpolation over surrounding NOAA GSOD stations, optionally harmonized with
        live current weather in online mode.
        """
        if df is None or len(df) == 0:
            raise ValueError("Dataset is empty.")

        # Aggregate unique stations with coordinates
        unique_stations = df if len(df) <= 50 else df.drop_duplicates(subset=["STATION"])

        def haversine_km(lat1, lon1, lat2, lon2):
            R = 6371.0
            dlat = np.radians(lat2 - lat1)
            dlon = np.radians(lon2 - lon1)
            a = np.sin(dlat / 2.0)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2.0)**2
            c = 2.0 * np.arcsin(np.sqrt(np.clip(a, 0.0, 1.0)))
            return R * c

        st_lats = unique_stations["LATITUDE"].values
        st_lons = unique_stations["LONGITUDE"].values
        distances = haversine_km(user_lat, user_lon, st_lats, st_lons)

        # Select top k nearest stations
        num_k = min(k, len(unique_stations))
        sorted_indices = np.argsort(distances)[:num_k]

        # Calculate IDW weights: w_i = 1 / (d_i + eps)^p
        eps = 0.05
        raw_weights = [1.0 / ((float(distances[idx]) + eps) ** p) for idx in sorted_indices]
        sum_weights = sum(raw_weights)
        norm_weights = [w / sum_weights for w in raw_weights]

        stations_used = []
        interp_temps = []
        interp_max_temps = []
        interp_dew_points = []
        interp_rhs = []
        interp_winds = []
        interp_pressures = []

        for rank, idx in enumerate(sorted_indices):
            st_row = unique_stations.iloc[idx]
            st_id = str(st_row["STATION"])
            dist_km = float(distances[idx])
            w_pct = round(norm_weights[rank] * 100, 1)

            t = float(st_row.get("mean_temp_c", st_row.get("TEMP", 32.0)))
            max_t = float(st_row.get("max_temp_c", st_row.get("MAX", t + 5.0)))
            dewp = float(st_row.get("dew_point_c", st_row.get("DEWP", 18.0)))
            rh = float(st_row.get("relative_humidity", 50.0))
            wind = float(st_row.get("wind_speed_kmh", st_row.get("WDSP", 12.0)))
            pres = float(st_row.get("pressure_hpa", st_row.get("sea_level_pressure_hpa", st_row.get("SLP", 1008.0))))
            hi = float(st_row.get("heat_index_c", t + 3.0))

            interp_temps.append(t)
            interp_max_temps.append(max_t)
            interp_dew_points.append(dewp)
            interp_rhs.append(rh)
            interp_winds.append(wind)
            interp_pressures.append(pres)

            st_name = str(st_row.get("NAME", f"Station {st_id}")).split(",")[0].strip()
            stations_used.append({
                "station_id": st_id,
                "name": st_name,
                "distance_km": round(dist_km, 1),
                "weight_pct": w_pct,
                "temperature_c": round(t, 1),
                "heat_index_c": round(hi, 1)
            })

        # Calculate IDW interpolated weather features
        idw_temp = sum(t * w for t, w in zip(interp_temps, norm_weights))
        idw_max_temp = sum(t * w for t, w in zip(interp_max_temps, norm_weights))
        idw_dew_point = sum(d * w for d, w in zip(interp_dew_points, norm_weights))
        idw_rh = sum(r * w for r, w in zip(interp_rhs, norm_weights))
        idw_wind = sum(w * weight for w, weight in zip(interp_winds, norm_weights))
        idw_pressure = sum(p * weight for p, weight in zip(interp_pressures, norm_weights))

        final_temp = idw_temp
        final_rh = idw_rh
        final_dew_point = idw_dew_point
        final_max_temp = idw_max_temp
        final_wind = idw_wind
        final_pressure = idw_pressure
        data_source_mode = "offline"
        provider_note = "Local NOAA GSOD 2022–2025 multi-station IDW spatial interpolation"

        # If online mode requested, query live Open-Meteo current observations
        if mode == "online":
            try:
                import urllib.request
                import json
                url = (
                    f"https://api.open-meteo.com/v1/forecast?"
                    f"latitude={user_lat}&longitude={user_lon}&"
                    f"current=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,surface_pressure,wind_speed_10m"
                )
                req = urllib.request.Request(url, headers={"User-Agent": "HeatShieldAI/1.0"})
                with urllib.request.urlopen(req, timeout=2.0) as resp:
                    if resp.status == 200:
                        live_data = json.loads(resp.read().decode())
                        current = live_data.get("current", {})
                        if "temperature_2m" in current and current["temperature_2m"] is not None:
                            final_temp = float(current["temperature_2m"])
                            final_rh = float(current.get("relative_humidity_2m", idw_rh))
                            final_dew_point = float(current.get("dew_point_2m", idw_dew_point))
                            final_wind = float(current.get("wind_speed_10m", idw_wind))
                            final_pressure = float(current.get("surface_pressure", idw_pressure))
                            final_max_temp = max(final_temp + 3.5, idw_max_temp)
                            data_source_mode = "online"
                            provider_note = "Live Open-Meteo Current Observations harmonized with GSOD Multi-Station IDW Baseline"
            except Exception:
                # Graceful fallback to GSOD IDW
                data_source_mode = "offline"
                provider_note = "Fallback to Local NOAA GSOD 2022–2025 IDW (Live Weather Service Offline/Unreachable)"

        # Rothfusz Heat Index calculation
        tf = final_temp * 1.8 + 32.0
        hi_f = (
            -42.379
            + 2.04901523 * tf
            + 10.14333127 * final_rh
            - 0.22475541 * tf * final_rh
            - 0.00683783 * (tf ** 2)
            - 0.05481717 * (final_rh ** 2)
            + 0.00122874 * (tf ** 2) * final_rh
            + 0.00085282 * tf * (final_rh ** 2)
            - 0.00000199 * (tf ** 2) * (final_rh ** 2)
        )
        heat_index_c = round((hi_f - 32.0) / 1.8, 1)

        # Continuous Heat Stress Index
        hsi = 0.5 * final_temp + 0.4 * heat_index_c + 0.1 * final_max_temp - 0.05 * final_wind
        risk_score = int(np.clip(round(hsi), 5, 99))

        if risk_score <= 25:
            risk_level = "LOW"
            vulnerability_tier = "Low"
        elif risk_score <= 50:
            risk_level = "MODERATE"
            vulnerability_tier = "Moderate"
        elif risk_score <= 75:
            risk_level = "HIGH"
            vulnerability_tier = "High"
        elif risk_score <= 90:
            risk_level = "VERY HIGH"
            vulnerability_tier = "High"
        else:
            risk_level = "EXTREME"
            vulnerability_tier = "Extreme"

        # Determine dominant cluster profile
        nearest_st_id = stations_used[0]["station_id"]
        nearest_st_row = unique_stations.iloc[sorted_indices[0]]
        cluster_id = int(nearest_st_row.get("cluster", 1))

        profile_lookup = {p["cluster_id"]: p for p in (profiles_list or [])}
        profile_meta = profile_lookup.get(cluster_id, {})
        profile_code = profile_meta.get("profile_code", f"Profile {chr(65 + cluster_id)}")
        profile_title = profile_meta.get("title", "High Thermal Stress")

        # Confidence Score calculation
        min_d = stations_used[0]["distance_km"]
        temp_spread = float(np.std(interp_temps)) if len(interp_temps) > 1 else 0.0
        confidence = int(np.clip(round(96.0 - 0.12 * min_d - 1.2 * temp_spread), 60, 98))

        peak_window = "11:30 AM – 4:00 PM" if risk_score >= 60 else "12:30 PM – 3:00 PM"

        # Synthesize persona & companion recommendations
        dummy_rec = {
            "STATION": nearest_st_id,
            "NAME": f"User Location ({round(user_lat, 3)}°N, {round(user_lon, 3)}°E)",
            "LATITUDE": user_lat,
            "LONGITUDE": user_lon,
            "mean_temp_c": round(final_temp, 1),
            "max_temp_c": round(final_max_temp, 1),
            "dew_point_c": round(final_dew_point, 1),
            "relative_humidity": round(final_rh, 1),
            "heat_index_c": heat_index_c,
            "heat_stress_index": round(hsi, 1),
            "cluster": cluster_id,
            "wind_speed_kmh": round(final_wind, 1),
            "sea_level_pressure_hpa": round(final_pressure, 1)
        }
        companion_assessment = cls.get_citizen_risk_assessment(dummy_rec)

        recommendations = [
            f"Peak hazard window is {peak_window}. Minimize strenuous outdoor activities during these hours.",
            f"Current feels-like heat index is {heat_index_c}°C. Maintain hydration rate of at least 250ml per 30 minutes of exertion.",
            "Wear light, loose-fitting cotton clothing and carry head cover/parasol.",
            "Check on infants, outdoor workers, and seniors who are disproportionately susceptible to heat strain."
        ]

        return {
            "location": {
                "latitude": round(user_lat, 4),
                "longitude": round(user_lon, 4),
                "accuracy_m": round(float(accuracy_m or 18.0), 1)
            },
            "location_source": "GPS",
            "data_source": {
                "mode": data_source_mode,
                "stations_used": stations_used,
                "interpolation": f"Inverse Distance Weighting (IDW, p={p})",
                "provider_note": provider_note
            },
            "weather": {
                "temperature": round(final_temp, 1),
                "dew_point": round(final_dew_point, 1),
                "humidity": round(final_rh, 1),
                "wind_speed": round(final_wind, 1),
                "pressure": round(final_pressure, 1),
                "max_temperature": round(final_max_temp, 1),
                "feels_like": heat_index_c
            },
            "prediction": {
                "risk_score": risk_score,
                "risk_level": risk_level,
                "profile": profile_code,
                "profile_title": profile_title,
                "cluster_id": cluster_id,
                "peak_window": peak_window,
                "confidence_score": confidence,
                "recommendations": recommendations
            },
            "risk_assessment": companion_assessment
        }

    @classmethod
    def get_all_stations_live_status(
        cls,
        df: pd.DataFrame,
        profiles_list: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Returns live real-time status, temperature, heat index, risk scores,
        and predicted cluster profiles for all 46 monitored stations.
        """
        if df is None or len(df) == 0:
            return {"total_stations": 0, "stations": [], "tier_counts": {}}

        unique_st_ids = df["STATION"].unique()
        stations_output = []

        profile_lookup = {}
        if profiles_list:
            for p in profiles_list:
                profile_lookup[p["cluster_id"]] = p

        tier_counts = {
            "extreme": 0,
            "very_high": 0,
            "high": 0,
            "moderate": 0,
            "low": 0
        }

        all_temps = []

        for st_id in unique_st_ids:
            st_records = df[df["STATION"] == st_id]
            rec = st_records.iloc[-1].to_dict()

            temp = float(rec.get("mean_temp_c", rec.get("TEMP", 30.0)))
            max_t = float(rec.get("max_temp_c", rec.get("MAX", temp + 5.0)))
            dewp = float(rec.get("dew_point_c", rec.get("DEWP", 18.0)))
            rh = float(rec.get("relative_humidity", 50.0))
            hi = float(rec.get("heat_index_c", temp + 3.0))
            hsi = float(rec.get("heat_stress_index", 50.0))
            cluster_id = int(rec.get("cluster", 0))

            all_temps.append(temp)

            # Risk Score calculation consistent with get_citizen_risk_assessment
            risk_score = int(np.clip(round(hsi), 5, 99))
            if risk_score <= 25:
                tier_badge = "LOW"
                tier_name = "Low Risk"
                color = "#10B981"
                vulnerability_tier = "Low"
                tier_counts["low"] += 1
            elif risk_score <= 50:
                tier_badge = "MODERATE"
                tier_name = "Moderate Risk"
                color = "#F59E0B"
                vulnerability_tier = "Moderate"
                tier_counts["moderate"] += 1
            elif risk_score <= 75:
                tier_badge = "HIGH"
                tier_name = "High Risk"
                color = "#F97316"
                vulnerability_tier = "High"
                tier_counts["high"] += 1
            elif risk_score <= 90:
                tier_badge = "VERY HIGH"
                tier_name = "Very High Risk"
                color = "#EF4444"
                vulnerability_tier = "High"
                tier_counts["very_high"] += 1
            else:
                tier_badge = "EXTREME"
                tier_name = "Extreme Risk"
                color = "#7C3AED"
                vulnerability_tier = "Extreme"
                tier_counts["extreme"] += 1

            profile_meta = profile_lookup.get(cluster_id, {})
            profile_code = profile_meta.get("profile_code", f"Profile {chr(65 + cluster_id)}")
            profile_title = profile_meta.get("title", f"Vulnerability Cluster {cluster_id}")

            peak_window = "11:30 AM – 4:00 PM" if risk_score >= 60 else "12:30 PM – 3:00 PM"
            full_name = str(rec.get("NAME", f"Station {st_id}"))
            clean_name = full_name.split(",")[0].strip()

            stations_output.append({
                "station_id": str(st_id),
                "station_name": clean_name,
                "full_name": full_name,
                "latitude": round(float(rec.get("LATITUDE", 0.0)), 4),
                "longitude": round(float(rec.get("LONGITUDE", 0.0)), 4),
                "temperature_c": round(temp, 1),
                "max_temperature_c": round(max_t, 1),
                "dew_point_c": round(dewp, 1),
                "relative_humidity_pct": round(rh, 1),
                "heat_index_c": round(hi, 1),
                "heat_stress_index": round(hsi, 1),
                "heat_risk_score": risk_score,
                "tier_badge": tier_badge,
                "tier_name": tier_name,
                "color": color,
                "cluster_id": cluster_id,
                "profile_code": profile_code,
                "profile_title": profile_title,
                "vulnerability_tier": vulnerability_tier,
                "peak_danger_window": peak_window
            })

        # Sort by heat risk score descending
        stations_output.sort(key=lambda x: x["heat_risk_score"], reverse=True)

        hottest = stations_output[0]["station_name"] if stations_output else "N/A"
        mean_t = round(float(np.mean(all_temps)), 1) if all_temps else 0.0

        return {
            "total_stations": len(stations_output),
            "stations": stations_output,
            "tier_counts": tier_counts,
            "mean_temperature_c": mean_t,
            "hottest_station": hottest
        }


