# HeatShield AI — Biometeorological Safety Engine & Clinical Triage Matrix

## 1. Paradigm Shift: From Academic Clustering to Citizen Action

Traditional environmental machine learning projects conclude by generating spatial heat vulnerability cluster maps. While valuable for macroscopic municipal planning, **a cluster map cannot protect an outdoor laborer, an elderly person, or a delivery courier on a scorching afternoon**.

HeatShield AI translates complex biometeorological mathematics into direct, personalized, and actionable public health guidance:
- **From**: *"Your location belongs to Cluster 2 ($K$-Means centroid $36.8^\circ\text{C}, 62\% RH$)."*
- **To**: *"🔴 VERY HIGH HEAT RISK (84/100). Evaporative sweat cooling is failing due to high humidity. Take mandatory 15-minute shade breaks every 45 minutes of outdoor labor."*

---

## 2. The 5-Tier Biometeorological Danger Matrix

The core decision engine categorizes thermal stress into five internationally standardized tiers based on NOAA National Weather Service (NWS) and World Meteorological Organization (WMO) biometeorological criteria:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           BIOMETEOROLOGICAL 5-TIER DANGER MATRIX                        │
├─────────────┬──────────────┬──────────────┬─────────────┬───────────────────────────────┤
│ Risk Tier   │ Heat Index   │ Score Range  │ Badge Color │ Primary Physiological Hazard  │
├─────────────┼──────────────┼──────────────┼─────────────┼───────────────────────────────┤
│ Low         │ ≤ 29.0°C     │ 0 – 39       │ 🟢 Emerald  │ Normal homeostasis maintained │
│ Moderate    │ 30.0 – 37.0°C│ 40 – 59      │ 🟡 Amber    │ Fatigue during prolonged work │
│ High        │ 38.0 – 44.0°C│ 60 – 74      │ 🟠 Orange   │ Heat cramps & dehydration     │
│ Very High   │ 45.0 – 53.0°C│ 75 – 89      │ 🔴 Crimson  │ Heat exhaustion; stroke risk  │
│ Extreme     │ ≥ 54.0°C     │ 90 – 100     │ 🟣 Purple   │ Imminent heatstroke; fatal    │
└─────────────┴──────────────┴──────────────┴─────────────┴───────────────────────────────┘
```

### The "Wet-Bulb Trap" Explained
A critical feature of the biometeorological matrix is detecting the **Wet-Bulb Trap**:
- **Scenario A (Dry Heat)**: $42^\circ\text{C}$ dry-bulb temperature with $18\%$ relative humidity yields a Heat Index of $41.8^\circ\text{C}$ (High Risk). Because ambient air is dry, human sweat evaporates rapidly, providing effective cutaneous cooling.
- **Scenario B (Humid Heat)**: $36^\circ\text{C}$ dry-bulb temperature with $72\%$ relative humidity yields an alarming Heat Index of **$54.2^\circ\text{C}$ (Extreme Risk)**. Even though the ambient thermometer is $6^\circ\text{C}$ lower, the moisture-saturated air prevents perspiration from evaporating. The core body temperature rises rapidly, inducing severe cardiovascular strain.

HeatShield AI explicitly isolates and flags humid heat dynamics to prevent citizens from being misled by moderate ambient temperature readings.

---

## 3. Continuous Heat Stress Index (HSI) ($0\text{--}100$)

In addition to discrete 5-tier classification, HeatShield AI computes a continuous, normalized **Heat Stress Index (HSI)** score from $0$ to $100$:

$$HSI = \min\left(100, \max\left(0, \alpha \cdot \text{TempContrib} + \beta \cdot \text{HumidContrib} + \gamma \cdot \text{SolarContrib} - \delta \cdot \text{WindMitigation}\right)\right)$$

### Factor Weights & Physiological Rationale:
1. **$\alpha = 0.40$ (Ambient Temperature Contribution)**:
   $$\text{TempContrib} = \text{clamp}\left( \frac{T - 20}{30} \times 100, 0, 100 \right)$$
   Direct sensible heat load transferred to the human body.
2. **$\beta = 0.30$ (Relative Humidity Contribution)**:
   $$\text{HumidContrib} = \text{clamp}\left( \frac{RH - 20}{70} \times 100, 0, 100 \right)$$
   Represents resistance to cutaneous evaporative sweat vaporization.
3. **$\gamma = 0.15$ (Solar / Diurnal Range Contribution)**:
   $$\text{SolarContrib} = \text{clamp}\left( \frac{DTR - 5}{20} \times 100, 0, 100 \right)$$
   Proxy for peak solar radiative intensity during clear daylight hours.
4. **$\delta = 0.15$ (Wind Convective Cooling Mitigation)**:
   $$\text{WindMitigation} = \text{clamp}\left( \frac{W - 5}{25} \times 100, 0, 100 \right)$$
   *Convective Heat Dissipation*: Higher boundary-layer wind speed thins the stagnant boundary air layer surrounding human skin, facilitating convective and evaporative cooling. (Capped when air temperature exceeds skin temperature $37^\circ\text{C}$ to prevent convective thermal heating).

---

## 4. Vulnerability Persona Architecture

Different demographic cohorts exhibit vastly different physiological thresholds for heat stress. HeatShield AI defines **6 Vulnerability Personas**:

| Persona Code | Demographic Profile | Core Physiological Vulnerability | Tailored Interventions |
|---|---|---|---|
| `outdoor_worker` | Agricultural / Construction | High metabolic heat production; direct solar exposure | Mandatory 15-min shade per 45-min labor; ORS rehydration |
| `delivery_worker` | Gig couriers, two-wheeler riders | Radiant engine heat, traffic exhaust, dark helmets | Hydration stops every 5 deliveries; avoid polyester apparel |
| `elderly` | Seniors ($>65$ years) | Impaired thirst sensation; reduced cardiac reserve | Air-conditioned refuge; hourly caregiver check-ins; monitor pulse |
| `infant_child` | Infants & toddlers ($0\text{--}5$) | High body surface-to-mass ratio; underdeveloped sweating | Never leave in parked vehicles; loose cotton; monitor wet diapers |
| `chronic_illness` | Cardiovascular & renal patients | Diuretics & beta-blockers impair thermoregulation | Medical fluid balance management; stay strictly indoors ($<26^\circ\text{C}$) |
| `general_public` | Commuters & office workers | Moderate exertion, transit heat transitions | Hydration pacing; UV protection; avoid peak window ($12\text{--}4\,\text{PM}$) |

---

## 5. Activity Evaluator & Schedule Negotiator

Rather than merely telling users "do not go outside," HeatShield AI functions as an **intelligent schedule negotiator**:
1. The user inputs their planned activity (e.g., *Strenuous Outdoor Labor*, *Jogging*, *Commuting*, *Grocery Shopping*), planned hour, and duration.
2. The engine projects the diurnal thermodynamic curve for that location.
3. **Safety Verdict**:
   - 🟢 **SAFE**: Predicted Heat Index $< 32^\circ\text{C}$.
   - 🟡 **CAUTION**: Predicted Heat Index $32\text{--}40^\circ\text{C}$; requires shade intervals.
   - 🔴 **DANGEROUS**: Predicted Heat Index $> 40^\circ\text{C}$; high risk of heat illness.
4. **Safer Alternative Recommendation**: Evaluates earlier morning ($6\text{--}9\,\text{AM}$) and late evening ($6\text{--}9\,\text{PM}$) windows, presenting safer time slots with expected temperatures.

---

## 6. Clinical Symptom Triage Matrix

The companion includes an interactive symptom triage screener that classifies user-reported symptoms into three clinical urgency tiers:

```
                                 USER-REPORTED SYMPTOMS
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
         [TIER 1: MILD]             [TIER 2: WARNING]           [TIER 3: EMERGENCY]
       - Mild Fatigue             - Muscle Cramps              - Confusion / Delirium
       - Minor Headache           - Heavy Persistent Sweating  - Hot, Dry Skin (No Sweat)
       - Heat Rash (Prickly)      - Dizziness / Lightheaded    - Vomiting / Nausea
               │                            │                  - Loss of Consciousness
               │                            │                            │
               ▼                            ▼                            ▼
     [CLINICAL DIRECTIVE]         [CLINICAL DIRECTIVE]         [CLINICAL DIRECTIVE]
     • Rest in shaded room        • Cease all exertion         • 🚨 MEDICAL EMERGENCY
     • Sip cool water (500ml)     • Move to AC environment     • Immediate 108 Ambulance
     • Loosen tight clothing      • Drink electrolyte / ORS    • Cold water / ice immersion
     • Fan cutaneous surface      • Elevate legs slightly      • Do NOT give oral liquids
```

- **One-Tap Emergency Dispatch**: Tier 3 integrates direct mobile dialing (`tel:108`) for national emergency medical services.

---

## 7. Trilingual Localization Engine

To serve vulnerable agricultural populations across North India, all safety messages, persona directives, and emergency instructions are localized in three languages:
- **English (`en`)**: Academic and international standard.
- **Hindi (`hi`)**: Widely spoken across the Gangetic heat belt (Uttar Pradesh, Bihar, Delhi, Rajasthan, Madhya Pradesh).
- **Punjabi (`pa`)**: Tailored for Punjab agricultural field laborers and farmers.
