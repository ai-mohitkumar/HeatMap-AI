# HeatShield AI 2.0 — Unsupervised Spatiotemporal Climate Intelligence Platform & Offline Safety System

[![Live App](https://img.shields.io/badge/Live%20Web%20App-Vercel-000000.svg?logo=vercel)](https://heat-map-ai.vercel.app/)
[![Backend API](https://img.shields.io/badge/Live%20API-Render-46E3B7.svg?logo=render)](https://heatshield-ai-backend-jls2.onrender.com/docs)
[![Project ID](https://img.shields.io/badge/Project%20ID-SIH26083-blue.svg)](https://github.com/ai-mohitkumar/HeatMap-AI)
[![Course Outcomes](https://img.shields.io/badge/Course%20Outcomes-CO2%20%7C%20CO3%20%7C%20CO5-green.svg)](https://github.com/ai-mohitkumar/HeatMap-AI)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61DAFB.svg)](https://react.dev)
[![scikit-learn](https://img.shields.io/badge/ML-scikit--learn-F7931E.svg)](https://scikit-learn.org)
[![LOSOCV Validated](https://img.shields.io/badge/LOSOCV-k%3D4%2C%20p%3D2.0-blueviolet.svg)](./IDW_VALIDATION.md)
[![Sub-Millisecond](https://img.shields.io/badge/Latency-%3C1ms%20(0.36ms%20median)-brightgreen.svg)](./IDW_VALIDATION.md)
[![Offline Resilient](https://img.shields.io/badge/Offline-Labeled%20IDW%20Fallback-success.svg)](./OFFLINE_MODE.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Live Web Application:** https://heat-map-ai.vercel.app/  
> **Live API & Interactive Docs:** https://heatshield-ai-backend-jls2.onrender.com/docs  
> **Academic Assignment Project No. 25 & Societal Impact Platform**  
> **Title**: Unsupervised Spatiotemporal Climate Intelligence Platform: Regional Heat-Stress Discovery, Manifold Learning, Anomaly Detection & Personal Heat Safety  
> **Course Outcomes**: CO2 (Data Preprocessing, Scaling & Ingestion), CO3 (Partition & Hierarchical Clustering, GMM, HDBSCAN, Optimal-$K$ Sweeps), CO5 (PCA, UMAP & Neural Autoencoder Latent Manifolds, Spatial Priority Mapping).

---

## 📌 Executive Summary

Modern extreme heatwaves present complex thermodynamic hazards that cannot be captured by ambient dry-bulb temperature alone. Elevated relative humidity cripples cutaneous evaporative cooling, nocturnal thermal retention impedes cardiovascular recovery, and boundary-layer microclimate traps concentrate localized biometeorological stress.

**HeatShield AI 2.0** is an end-to-end unsupervised spatiotemporal climate intelligence platform that discovers hidden heat regimes, latent manifolds, multidimensional microclimate anomalies, and emerging danger zones without labeled ground truth:
1. **Climate Intelligence Lab (RQ1–RQ6)**:
   - **RQ1 (Convergence)**: Proves that K-Means, Gaussian Mixture Models (BIC/AIC inflection), HDBSCAN, and Ward Linkage converge on identical physical climate regimes ($\text{Mean ARI} > 0.85$).
   - **RQ2 (Latent Manifolds)**: Trains a bottleneck Neural Autoencoder $(8 \to 16 \to 3 \to 16 \to 8)$ achieving $\text{MSE} \approx 0.041$, preserving non-linear compound moisture-thermal coupling that linear PCA flattens.
   - **RQ3 (Unsupervised Anomalies)**: Couples Isolation Forest tree path length with Local Outlier Factor (LOF) reachability density to detect acute thermodynamic departures.
   - **RQ4 (Markov Dynamics)**: Formulates an empirical stationary transition matrix tracking 4-year climate regime migration ($P_{ii} \ge 88\%$).
   - **RQ5 (Feature Ablation)**: Systematically tests 6 feature permutations, proving moisture exclusion causes a catastrophic $-26.1\%$ collapse in cluster separation ($F_{\text{RH}} = 342.2$).
   - **RQ6 (Emerging Hotspots)**: Couples spatial IDW ($k=4, p=2.0$) with local anomaly scores to reveal emerging danger zones ($EHI$).
2. **Citizen Heat-Safety Companion**: Multi-tier location acquisition (Native Android GPS → W3C GNSS → Wi-Fi/Cell → direct public IP fallback with explicit `unavailable` state and zero silent hardcoded city defaults), reverse geocoding via Nominatim/BigDataCloud, live Open-Meteo weather with explicit source provenance separation, Rothfusz Heat Index, 6 vulnerability personas, and clinical triage.
3. **Offline-Resilient IDW & Hybrid Vector Map Engine**: Sub-millisecond spatial interpolation ($0.36\text{ms}$ median / $0.41\text{ms}$ mean in latest Python validation; $<1\text{ms}$ target), built-in HTML5 Canvas `OfflineVectorGridLayer` with 4-provider live tile failover (CARTO Dark/Voyager, Esri, OSM) for web, Desktop standalone loopback server (`server.py` / `server.ps1`), and native Android APK (`LocalAssetServer` on `127.0.0.1` + `HeatShieldNativeGps` bridge), alongside Service Worker caching (`NO_CACHE_API_PREFIXES` ensures dynamic geo/weather endpoints never replay stale `is_live: true` responses offline).

---

## 🏛️ Tri-Capability System Architecture

```
                               USER DEVICE (Web / PWA / Android APK)
                                                 │
             Multi-Tier Geolocation (GPS / Wi-Fi / Public IP / Manual Search)
     • Retains raw (lat, lon, ±accuracy_m, source)   • Never silently defaults to a preset city
             │                                                                 │
             ▼                                                                 ▼
   [REVERSE GEOCODING]                                              [LOCATION UNAVAILABLE]
  /api/geo/reverse (Nominatim)                                    Explicit status: "unavailable"
  -> BigDataCloud -> Labeled Haversine                            User prompts for manual city/district
             │
             ├──────────────────────────────────┬──────────────────────────────┐
             ▼                                  ▼                              ▼
    [LIVE WEATHER PATH]                [FORECAST PATH]              [OFFLINE ESTIMATE PATH]
  Open-Meteo Current API          Open-Meteo Hourly Forecast     NOAA GSOD 2022–2025 IDW (k=4, p=2)
  (&timezone=auto, observed_at)    (&timezone=auto, 06–20h)       (explicitly tagged offline_estimate)
             │                                  │                              │
             └──────────────────────────────────┼──────────────────────────────┘
                                                ▼
                  [HEATSHIELD RESEARCH ML & BIOMETEOROLOGY ENGINE]
       • FastAPI REST Backend (Render) & Pre-Cached Client TS Engine (Offline/PWA)
       • RobustScaler (IQR), ANOVA F-Test, K-Means (K=4, Sil=0.51), Ward's (ARI=0.772)
       • 2D/3D PCA, UMAP, Bottleneck Autoencoder, Isolation Forest, Markov Matrix
       • Rothfusz Heat Index (Steadman gate + RHS adj.), Continuous HSI, 5-Tier Triage
                                                │
                                                ▼
                              MODERN RESPONSIVE USER INTERFACE
                               (React 19 + TypeScript + Vite)
      ┌────────────────────────────────────────────────────────────────────────┐
      │ • Personal HeatShield Home      • National GPS Network Map & IDW Grid  │
      │ • All 46 Stations Live View     • Empirical IDW Validation Drawer      │
      │ • Source/Confidence Badges      • Emergency SOS & Cooling Shelters     │
      │ • Climate Intelligence Lab      • Universal AI Heat Assistant          │
      └────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Capabilities

### 1. 🔬 Research-Grade Unsupervised Machine Learning
- **Dataset**: Multi-year NOAA GSOD observational data (3,680 records across 46 synoptic stations).
- **Automated Preprocessing**: Handling NOAA missing indicators (`9999.9`), wind conversion ($0.514444\,\text{m/s}$ per knot), pressure reduction, and outlier management via median absolute deviation.
- **Biometeorological Formulations**: Magnus-Tetens saturation vapor pressure ($RH$), NOAA Rothfusz Heat Index ($HI$), Diurnal Temperature Range ($DTR$), and Canadian Humidex.
- **Optimal-$K$ Recommendation**: Sweeps $K \in [2..8]$ evaluating Silhouette Coefficient, Davies-Bouldin Index, Calinski-Harabasz, and Elbow WCSS curvature, identifying $K=4$ as optimal.
- **Hierarchical Validation**: Benchmarks $K$-Means against Ward's Agglomerative Hierarchical clustering, achieving an Adjusted Rand Index (ARI) of $0.772$.
- **Dimensionality Reduction**: 2D/3D Principal Component Analysis (PCA) capturing $84.2\%$ of cumulative variance, alongside UMAP non-linear manifold embeddings.

### 2. 🛡️ Public Safety & Biometeorological Companion
- **Continuous Heat Stress Index (HSI)**: Normalized $0\text{--}100$ score integrating ambient temperature ($40\%$), relative humidity ($30\%$), solar/diurnal range ($15\%$), and wind dissipation mitigation ($15\%$).
- **5-Tier Danger Classification**:
  - 🟢 **Low** ($\le 29^\circ\text{C}$ HI): Routine precautions.
  - 🟡 **Moderate** ($30\text{--}37^\circ\text{C}$ HI): Hydration reminders.
  - 🟠 **High** ($38\text{--}44^\circ\text{C}$ HI): Severe discomfort; outdoor work restrictions.
  - 🔴 **Very High** ($45\text{--}53^\circ\text{C}$ HI): Heat cramps and exhaustion probable; rapid heatstroke onset.
  - 🟣 **Extreme** ($\ge 54^\circ\text{C}$ HI): Life-threatening emergency; physiological cooling collapse.
- **Vulnerability Personas**: Tailored operational protocols for Outdoor Agricultural Workers, Gig Delivery Couriers, Construction Laborers, Elderly Individuals, Infants/Children, and Chronic Illness patients.
- **Schedule Negotiator**: Evaluates user activities against hourly diurnal curves to recommend cooler substitute time slots.
- **Clinical Symptom Triage**: Escalates users from mild muscle cramps to stage-3 heatstroke emergency with one-tap ambulance dispatch (`108`).

### 3. 🛰️ Offline-Resilient Architecture, Provenance Separation & Spatial IDW
- **Clear Source Separation**: Strictly distinguishes **Live Observation** (`Open-Meteo`, `observed_at` timestamp, `timezone=auto`), **Hourly Forecast** (`Open-Meteo Forecast API`), **Offline Estimate** (`NOAA GSOD IDW`, `observed_at = null`), and **Research Baseline** (46 synoptic weather stations).
- **Safe PWA Caching**: [`frontend/public/sw.js`](./frontend/public/sw.js) precaches the application shell for offline use while excluding `/api/geo/*`, `/api/safety/*`, and `/api/predict/*` (`NO_CACHE_API_PREFIXES`) so stale weather readings or old IP cities are never replayed when offline.
- **Security-Hardened IP Lookup**: [`backend/api/geo.py`](./backend/api/geo.py) accepts forwarded client IP headers (`X-Forwarded-For`, `X-Real-IP`) only when the immediate peer is allowlisted in `TRUSTED_PROXY_IPS`, rejects non-routable/loopback/CGNAT ranges, and returns explicit `status: "unavailable"` instead of defaulting to a hardcoded city.
- **Mathematical IDW Optimization**: Evaluates $k \in [1..6]$ nearest neighbors and distance powers $p \in [1.0..3.0]$ via Leave-One-Station-Out Cross-Validation (LOSOCV).
- **Selected Configuration**: $k=4, p=2.0$ represents the Pareto frontier of accuracy ($4.08^\circ\text{C}$ HI MAE, $2.76^\circ\text{C}$ Temp MAE, $R^2 = 0.233$ in [`IDW_VALIDATION.md`](./IDW_VALIDATION.md)) and physical grounding (inverse-square thermal radiation flux decay).
- **Sub-Millisecond Latency**: Latest release benchmark achieved **$0.364\text{ms}$ median / $0.394\text{ms}$ mean** ($2,538\text{ ops/sec}$, down from $0.78\text{ms}$ baseline across 1,000 iterations in [`IDW_VALIDATION.md`](./IDW_VALIDATION.md)), well under the $1\text{ms}$ real-time offline budget.

---

## 📊 Core Performance & Validation Metrics

| Parameter / Metric | Empirical Value | Physical / Scientific Meaning |
|---|---|---|
| **Selected IDW Neighbors ($k$)** | **4 stations** | Balanced 4-quadrant spatial sampling without microclimate bleed |
| **Distance Weighting Power ($p$)** | **2.0** | Matches inverse-square law ($1/d^2$) of thermal flux radiation |
| **LOSOCV Heat Index MAE** | **$4.08^\circ\text{C}$** | Cross-validated spatial error across all 46 synoptic stations |
| **LOSOCV Temperature MAE** | **$2.76^\circ\text{C}$** | Mean absolute ambient temperature error across India |
| **LOSOCV $R^2$ Score** | **$0.233$** | Spatial variance explained in LOSOCV (`IDW_VALIDATION.md`) |
| **Distance Correlation (Pearson $r$)**| **$0.183$** | Weak correlation confirms spatial locality holds without error explosion |
| **Mean Offline Latency** | **$0.394\text{ms}$ (baseline $0.78\text{ms}$)** | Sub-millisecond execution on standard single-thread CPU |
| **Median / P95 Latency** | **$0.364\text{ms}$ / $1.01\text{ms}$** | Bounded sub-millisecond inference under load |
| **Throughput** | **$2,538\text{ ops/sec}$** | High-throughput offline spatial inference capability |
| **Optimal Cluster Count ($K$)** | **$4$** | Maximum separation of Distinct Climate Regimes (Silhouette $0.51$) |
| **Ward's Partition Agreement (ARI)**| **$0.772$** | High agreement between Partition and Hierarchical clustering |
| **PCA Cumulative Variance (2D)** | **$84.2\%$** | Total variance preserved in 2D biplot projection |

---

## 📂 Academic Documentation Index

For in-depth viva examination, research review, and architectural audit, refer to the dedicated reference documents:

1. 🏛️ **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Component diagrams, GNSS reception flow, Service Worker offline caching, and FastAPI endpoints.
2. 🚀 **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Production deployment configuration for Vercel (SPA + `/api/*` rewrite + cache headers), Render (`render.yaml` & `TRUSTED_PROXY_IPS`), and Docker.
3. 🔬 **[METHODOLOGY.md](./METHODOLOGY.md)**: Mathematical formulations, data cleaning, feature engineering, ANOVA $F$-test, and clustering sweeps.
4. 📐 **[IDW_VALIDATION.md](./IDW_VALIDATION.md)**: Full LOSOCV experiment across 30 $(k, p)$ configurations, station residuals, and distance correlation.
5. 📴 **[OFFLINE_MODE.md](./OFFLINE_MODE.md)**: Offline architecture, Service Worker cache strategy, and Haversine geodesy.
6. 🛡️ **[SAFETY_ENGINE.md](./SAFETY_ENGINE.md)**: Biometeorological decision logic, Rothfusz equations, persona sensitivity matrix, and clinical triage.
7. ⚠️ **[LIMITATIONS.md](./LIMITATIONS.md)**: Physical boundary limits, altitude lapse rate assumptions, urban heat island constraints, and future work.
8. 🎓 **[VIVA_QUESTIONS.md](./VIVA_QUESTIONS.md)**: Top 25 tough academic examiner questions with exhaustive, scientifically backed answers.

---

## 🚀 Quickstart & Deployment Guide

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.12)
- **Node.js**: 18+ (tested on Node 20 / Node 22)
- **OS**: Windows, Linux, or macOS

### 1. Clone & Set Up Backend
```bash
git clone https://github.com/ai-mohitkumar/HeatMap-AI.git
cd HeatMap-AI

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the complete test suite (52 backend, safety, geo, provenance, and map/bundle tests)
python -m pytest tests/ -v

# Start the FastAPI server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Set Up & Run Frontend
```bash
cd frontend

# Install Node dependencies
npm install

# Lint, type-check & build production bundle
npm run lint && npm run build

# Start local development server
npm run dev
```

- Local Web App: http://localhost:5173/
- Local Swagger API Docs: http://127.0.0.1:8000/docs
- Cloud Production Guide (Vercel, Render & Docker): see **[DEPLOYMENT.md](./DEPLOYMENT.md)**

---

## 🧪 Running Automated Verification

Execute the 52-test automated regression suite covering the ML pipeline, biometeorological 5-tier safety matrix, 787-district geo registry, trusted-proxy security, reverse geocoding, live/offline provenance separation, offline vector map resilience, and signed APK/Desktop package integrity:

```bash
# Run full pytest suite (52 tests across 5 test modules)
.venv\Scripts\python.exe -m pytest tests/ -v

# Run end-to-end release qualification gate (10/10 checks: pytest + LOSOCV + benchmark + oxlint + vite build + SW + GNSS)
.venv\Scripts\python.exe scripts/release_validation.py
```

Latest verified qualification summary:
```text
tests/test_pipeline.py                 8/8 passed
tests/test_safety_matrix.py           12/12 passed
tests/test_geo_store.py                8/8 passed
tests/test_climate_intelligence.py     7/7 passed
tests/test_geo_and_weather_fixes.py   17/17 passed
--------------------------------------------------
Total Pytest Suite:                   52/52 PASSED
Master Release Gate (release_validation.py): 10/10 [QUALIFIED]
Frontend Lint & Build:                oxlint (0 errors) + tsc -b && vite build
```

---

## 👥 Contributors & Academic Credits

- **Author / Lead Researcher**: Mohit Kumar
- **Academic Institution**: Lovely Professional University / SIH Project Track
- **Project Domain**: Artificial Intelligence, Spatial Biometeorology & Climate Public Safety
- **Data Source**: NOAA National Centers for Environmental Information (NCEI) — Global Summary of the Day (GSOD)
