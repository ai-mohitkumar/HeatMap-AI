# HeatShield AI 2.0 — Unsupervised Spatiotemporal Climate Intelligence Platform & Offline Safety System

[![Project ID](https://img.shields.io/badge/Project%20ID-SIH26083-blue.svg)](https://github.com)
[![Course Outcomes](https://img.shields.io/badge/Course%20Outcomes-CO2%20%7C%20CO3%20%7C%20CO5-green.svg)](https://github.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61DAFB.svg)](https://react.dev)
[![scikit-learn](https://img.shields.io/badge/ML-scikit--learn-F7931E.svg)](https://scikit-learn.org)
[![LOSOCV Validated](https://img.shields.io/badge/LOSOCV-k%3D4%2C%20p%3D2.0-blueviolet.svg)](./IDW_VALIDATION.md)
[![Sub-Millisecond](https://img.shields.io/badge/Latency-0.49ms%20(%3C1ms)-brightgreen.svg)](./IDW_VALIDATION.md)
[![Zero Network](https://img.shields.io/badge/Offline-100%25%20Zero--Network-success.svg)](./OFFLINE_MODE.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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
2. **Citizen Heat-Safety Companion**: Real-time GPS GNSS geolocation, live Rothfusz Heat Index calculation, 6 vulnerability personas, and clinical triage.
3. **Zero-Network Offline Engine**: Verified sub-millisecond execution ($0.49\text{ms}$ median, $1,680\text{ ops/sec}$) with zero network calls via Service Worker.

---

## 🏛️ Tri-Capability System Architecture

```
                                  USER DEVICE (Online / Offline)
                                                │
                                    Device GPS / HTML5 GNSS
                                (Latitude, Longitude, ±Accuracy)
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
        [ONLINE MODE]                                                 [OFFLINE MODE]
      FastAPI REST Server                                        Browser Service Worker & Cache
  (127.0.0.1:8000 / Cloud Daemon)                                  (Zero External Network Requests)
                 │                                                             │
                 ├──────────────────────────────┬──────────────────────────────┤
                 ▼                              ▼                              ▼
      [1. RESEARCH ML ENGINE]       [2. SAFETY BIOMETEOROLOGY]    [3. SPATIAL INTERPOLATION]
      • NOAA GSOD 2022-2025         • Rothfusz Heat Index         • Inverse Distance Weighting
      • RobustScaler (IQR)          • 5-Tier Safety Matrix        • k=4 Synoptic Neighbors
      • ANOVA F-Test Feature Sep    • Continuous HSI (0-100)      • p=2.0 Flux Decay (1/d²)
      • K-Means (K=4, Sil=0.51)     • 6 Vulnerability Personas    • Spherical Haversine Geodesy
      • Ward's Agglomerative (ARI)  • Activity Negotiator         • Latency: 0.78ms (<1ms)
      • 2D/3D PCA & UMAP Proj       • Clinical Symptom Triage     • LOSOCV MAE: 4.08°C HI
                 │                              │                              │
                 └──────────────────────────────┴──────────────────────────────┘
                                                │
                                                ▼
                              MODERN RESPONSIVE USER INTERFACE
                               (React 19 + TypeScript + Vite)
      ┌────────────────────────────────────────────────────────────────────────┐
      │ • Personal HeatShield Home      • National GPS Network Graph (SVG)     │
      │ • All 46 Regions Live Grid      • Empirical IDW Validation Drawer      │
      │ • Regional Priority Heatmap     • Emergency SOS & Cooling Shelters     │
      │ • 2D PCA Biplot & Feature Load  • Interactive AI Heat Assistant        │
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

### 3. 🛰️ Offline-First & Empirical Spatial IDW Interpolator
- **Zero-Network Architecture**: Functions entirely in aircraft mode or offline disaster zones. Pre-caches synoptic baselines in Service Worker storage.
- **Mathematical IDW Optimization**: Evaluates $k \in [1..6]$ nearest neighbors and distance powers $p \in [1.0..3.0]$ via Leave-One-Station-Out Cross-Validation (LOSOCV).
- **Selected Configuration**: $k=4, p=2.0$ represents the Pareto frontier of accuracy ($4.08^\circ\text{C}$ HI MAE, $2.76^\circ\text{C}$ Temp MAE, $R^2 = 0.77$) and physical grounding (inverse-square thermal radiation flux decay).
- **Sub-Millisecond Latency**: Mean latency of **$0.78\text{ms}$** ($783.6\mu\text{s}$) across 1,000 iterations ($1,275\text{ ops/sec}$), empirically verified via hardware timer benchmarks.

---

## 📊 Core Performance & Validation Metrics

| Parameter / Metric | Empirical Value | Physical / Scientific Meaning |
|---|---|---|
| **Selected IDW Neighbors ($k$)** | **4 stations** | Balanced 4-quadrant spatial sampling without microclimate bleed |
| **Distance Weighting Power ($p$)** | **2.0** | Matches inverse-square law ($1/d^2$) of thermal flux radiation |
| **LOSOCV Heat Index MAE** | **$4.08^\circ\text{C}$** | Cross-validated spatial error across all 46 synoptic stations |
| **LOSOCV Temperature MAE** | **$2.76^\circ\text{C}$** | Mean absolute ambient temperature error across India |
| **LOSOCV $R^2$ Score** | **$0.77$** | Percentage of national spatial variance explained by IDW model |
| **Distance Correlation (Pearson $r$)**| **$0.183$** | Weak correlation confirms spatial locality holds without error explosion |
| **Mean Offline Latency** | **$0.78\text{ms}$ ($783.6\mu\text{s}$)**| Sub-millisecond execution on standard single-thread CPU |
| **P95 Tail Latency** | **$1.01\text{ms}$** | Bounded latency under load |
| **Throughput** | **$1,275\text{ ops/sec}$** | High-throughput offline spatial inference capability |
| **Optimal Cluster Count ($K$)** | **$4$** | Maximum separation of Distinct Climate Regimes (Silhouette $0.51$) |
| **Ward's Partition Agreement (ARI)**| **$0.772$** | High agreement between Partition and Hierarchical clustering |
| **PCA Cumulative Variance (2D)** | **$84.2\%$** | Total variance preserved in 2D biplot projection |

---

## 📂 Academic Documentation Index

For in-depth viva examination, research review, and architectural audit, refer to the dedicated reference documents:

1. 🏛️ **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Component diagrams, GNSS reception flow, Service Worker offline caching, and FastAPI endpoints.
2. 🔬 **[METHODOLOGY.md](./METHODOLOGY.md)**: Mathematical formulations, data cleaning, feature engineering, ANOVA $F$-test, and clustering sweeps.
3. 📐 **[IDW_VALIDATION.md](./IDW_VALIDATION.md)**: Full LOSOCV experiment across 30 $(k, p)$ configurations, station residuals, and distance correlation.
4. 📴 **[OFFLINE_MODE.md](./OFFLINE_MODE.md)**: Zero-network offline architecture, Service Worker cache strategy, and Haversine geodesy.
5. 🛡️ **[SAFETY_ENGINE.md](./SAFETY_ENGINE.md)**: Biometeorological decision logic, Rothfusz equations, persona sensitivity matrix, and clinical triage.
6. ⚠️ **[LIMITATIONS.md](./LIMITATIONS.md)**: Physical boundary limits, altitude lapse rate assumptions, urban heat island constraints, and future work.
7. 🎓 **[VIVA_QUESTIONS.md](./VIVA_QUESTIONS.md)**: Top 25 tough academic examiner questions with exhaustive, scientifically backed answers.

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.12)
- **Node.js**: 18+ (tested on Node 20+)
- **OS**: Windows, Linux, or macOS

### 1. Clone & Set Up Backend
```bash
git clone https://github.com/ai-mohitkumar/User-Behavior-Clustering.git
cd "HeatMap AI"

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the complete test suite (18 biometeorological & pipeline tests)
python -m pytest tests/ -v

# Start the FastAPI daemon
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Set Up & Run Frontend
```bash
cd frontend

# Install Node dependencies
npm install

# Run TypeScript typecheck & production build
npm run build

# Start local development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.  
The interactive Swagger API docs will be at `http://127.0.0.1:8000/docs`.

---

## 🧪 Running Automated Verification

To execute the full verification suite including the biometeorological 5-tier safety matrix, wind dissipation physics, wet-bulb traps, persona differentiation, and pipeline tests:

```bash
# Run pytest with full verbosity
.venv\Scripts\python.exe -m pytest tests/ -v
```

Expected output:
```
tests/test_pipeline.py::test_multiyear_data_generation PASSED            [  5%]
tests/test_pipeline.py::test_preprocessing_pipeline PASSED               [ 11%]
tests/test_pipeline.py::test_feature_engineering_formulas PASSED         [ 16%]
tests/test_pipeline.py::test_anova_feature_separation PASSED             [ 22%]
tests/test_pipeline.py::test_kmeans_multi_k_evaluation PASSED            [ 27%]
tests/test_pipeline.py::test_pca_and_umap PASSED                         [ 33%]
tests/test_pipeline.py::test_station_explainability PASSED               [ 38%]
tests/test_pipeline.py::test_fastapi_endpoints PASSED                    [ 44%]
tests/test_safety_matrix.py::TestSafetyEngineMatrix::test_biometeorological_5_tier_matrix[24.0-40.0-Low] PASSED [ 50%]
tests/test_safety_matrix.py::TestSafetyEngineMatrix::test_biometeorological_5_tier_matrix[32.0-50.0-Moderate] PASSED [ 55%]
tests/test_safety_matrix.py::TestSafetyEngineMatrix::test_biometeorological_5_tier_matrix[36.0-55.0-High] PASSED [ 61%]
tests/test_safety_matrix.py::TestSafetyEngineMatrix::test_biometeorological_5_tier_matrix[40.0-55.0-Very High] PASSED [ 66%]
tests/test_safety_matrix.py::TestSafetyEngineMatrix::test_biometeorological_5_tier_matrix[45.0-75.0-Extreme] PASSED [ 72%]
tests/test_safety_matrix.py::TestSafetyEngineMatrix::test_humid_heat_vs_dry_heat_explainability PASSED [ 77%]
tests/test_safety_matrix.py::TestSafetyEngineMatrix::test_wind_dissipation_mitigation PASSED [ 83%]
tests/test_safety_matrix.py::TestSafetyEngineMatrix::test_persona_sensitivity_differentiation PASSED [ 88%]
tests/test_safety_matrix.py::TestSafetyEngineMatrix::test_activity_evaluator_safety_tiers PASSED [ 94%]
tests/test_safety_matrix.py::TestSafetyEngineMatrix::test_clinical_symptom_triage_escalation PASSED [100%]

======================= 18 passed in 6.15s =======================
```

---

## 👥 Contributors & Academic Credits

- **Author / Lead Researcher**: Mohit Kumar
- **Academic Institution**: Lovely Professional University / SIH Project Track
- **Project Domain**: Artificial Intelligence, Spatial Biometeorology & Climate Public Safety
- **Data Source**: NOAA National Centers for Environmental Information (NCEI) — Global Summary of the Day (GSOD)
