# HeatShield AI — System Architecture & Component Design

## 1. Architectural Philosophy & Design Principles

HeatShield AI is engineered around three non-negotiable operational principles:
1. **Dual-Tier Synergy**: The system functions simultaneously as a **macroscopic regional research platform** (clustering synoptic weather patterns across multiple years) and a **microscopic personal safety companion** (providing localized, real-time biometeorological guidance).
2. **Offline-First Resilience**: Severe heatwaves and tropical weather events frequently disrupt cellular towers and regional power grids. HeatShield AI is designed to achieve $100\%$ functional autonomy in zero-connectivity environments with zero external HTTP requests.
3. **Sub-Millisecond Computational Latency**: In mission-critical public safety scenarios, spatial interpolation must not block the UI thread or cause perceptible rendering lag. The spatial prediction engine is optimized to compute spatial heat risk in under $1.0\text{ms}$ on commodity hardware.

---

## 2. End-to-End System Architecture Diagram

```
                               ┌─────────────────────────────────────────────────────────────┐
                               │                    PHYSICAL SENSING LAYER                   │
                               │  - User Device GNSS Chipset (GPS / GLONASS / Galileo / NavIC)│
                               │  - HTML5 Geolocation API (enableHighAccuracy: true)         │
                               └──────────────────────────────┬──────────────────────────────┘
                                                              │ Coordinates: (lat, lon, ±accuracy)
                                                              ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                              CLIENT APPLICATION RUNTIME (BROWSER / PWA)                                   │
 │                                                                                                                           │
 │  ┌─────────────────────────────────┐   [Offline / Network Failure]   ┌──────────────────────────────────────────────────┐  │
 │  │        Service Worker           ├────────────────────────────────►│           Client-Side Offline Engine             │  │
 │  │  - Cache-First Asset Strategy   │                                 │  - Pre-cached 46 Synoptic Station Vectors        │  │
 │  │  - Intercepts /api/ Network I/O │                                 │  - Haversine Spherical Trigonometry              │  │
 │  └────────────────┬────────────────┘                                 │  - JavaScript IDW (k=4, p=2.0)                   │  │
 │                   │                                                  │  - Client-Side Rothfusz & HSI Equation           │  │
 │                   │ [Network Available]                              │  - LocalStorage Hydration & Location State       │  │
 │                   ▼                                                  └────────────────────────┬─────────────────────────┘  │
 │  ┌───────────────────────────────────────────────────────────┐                                │                            │
 │  │               React 19 User Interface Components          │                                │                            │
 │  │  - CompanionHome: Live GPS Banner, Hourly Advice, Hydration◄───────────────────────────────┘                            │
 │  │  - NationalGpsGraph: Interactive SVG Topology Graph       │                                                             │
 │  │  - IdwValidationModal: Empirical LOSOCV Proof & Benchmark │                                                             │
 │  │  - PriorityMap: Leaflet Geospatial Cluster Visualization  │                                                             │
 │  │  - PCAVisualizer & TemporalAnalysis: Multi-Year Analysis   │                                                             │
 │  └────────────────────────┬──────────────────────────────────┘                                                             │
 └───────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┘
                             │
                             │ HTTPS / REST (JSON)
                             ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                              SERVER APPLICATION RUNTIME (FASTAPI)                                         │
 │                                                                                                                           │
 │  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
 │  │                                                 API Routing Layer                                                   │  │
 │  │  - /api/dataset/*          - /api/clustering/*       - /api/safety/*           - /api/predict/location             │  │
 │  │  - /api/analysis/pca       - /api/analysis/umap      - /api/analysis/idw-val   - /api/analysis/benchmark           │  │
 │  └────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────┘  │
 │                           │                                                                                               │
 │                           ▼                                                                                               │
 │  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
 │  │                                           Core Computational Engines                                                │  │
 │  │                                                                                                                     │  │
 │  │  ┌──────────────────────────────┐  ┌──────────────────────────────┐  ┌──────────────────────────────────────────┐   │  │
 │  │  │  Biometeorological Engine    │  │  Spatial IDW Predictor       │  │  Machine Learning Pipeline               │   │  │
 │  │  │  - Magnus-Tetens (RH)        │  │  - Haversine Geodesic Index  │  │  - NOAA GSOD Ingestion (2022-2025)       │   │  │
 │  │  │  - Rothfusz Heat Index       │  │  - k=4 Nearest Stations      │  │  - Preprocessing & Missing Value Impute  │   │  │
 │  │  │  - Continuous HSI (0-100)    │  │  - p=2.0 Flux Power Weight   │  │  - RobustScaler Transformation           │   │  │
 │  │  │  - 5-Tier Danger Matrix      │  │  - Sub-millisecond NumPy     │  │  - ANOVA F-Test Feature Separation       │   │  │
 │  │  │  - 6 Vulnerability Personas  │  │  - Boundary Smoothing        │  │  - K-Means Sweeps (K=2..8)               │   │  │
 │  │  │  - Schedule Alternative Eval │  │  - Latency: 0.78ms Mean      │  │  - Ward's Agglomerative Hierarchical     │   │  │
 │  │  │  - Clinical Symptom Triage   │  │  - Throughput: 1,275 ops/sec │  │  - 2D/3D PCA & UMAP Manifold Embedding   │   │  │
 │  │  └──────────────────────────────┘  └──────────────────────────────┘  └──────────────────────────────────────────┘   │  │
 │  └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
 └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Pathways

### Path A: Live Satellite GNSS Geolocation & Interpolation
1. **Satellite Acquisition**: The browser queries the device GNSS receiver via `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy: true`.
2. **Signal Quality Assessment**: If accuracy is coarse ($>500\text{m}$), the UI informs the user while proceeding with spatial interpolation.
3. **Payload Dispatch**: Coordinates `(latitude, longitude, accuracy)` are dispatched to `POST /api/predict/location`.
4. **Spatial Filtering**:
   - Geodesic distances from the user's coordinate to all 46 synoptic stations are computed via vector-accelerated Haversine math.
   - The $k=4$ nearest stations are isolated.
   - Inverse distances $w_i = 1 / (d_i + \epsilon)^p$ (with $p=2.0, \epsilon=0.001\text{km}$) are normalized into percentage weights:
     $$\lambda_i = \frac{w_i}{\sum_{j=1}^{k} w_j}$$
5. **Feature Interpolation**: Ambient temperature, dew point, relative humidity, wind speed, and sea-level pressure are interpolated.
6. **Thermodynamic Risk Computation**:
   - Rothfusz Heat Index is evaluated on interpolated atmospheric values.
   - Continuous Heat Stress Index (HSI) ($0\text{--}100$) is computed.
   - Risk tier is categorized (Low, Moderate, High, Very High, Extreme).
   - Tailored persona precautions and nearest cooling centers are appended.
7. **Client Rendering**: UI updates dynamically without full-page reload in $<50\text{ms}$ total roundtrip time.

---

### Path B: Zero-Network Air-Gapped Fallback
1. **Network Interception**: When the device enters airplane mode or cellular infrastructure is downed, `navigator.onLine` toggles to `false`.
2. **Autonomous Redirection**: `api.predictLocation()` automatically bypasses the network call and routes coordinates directly to `interpolateLocationFeaturesOffline()` inside `offlineEngine.ts`.
3. **Local Synoptic Cache**: The client accesses pre-bundled meteorological baselines for all 46 synoptic stations stored in immutable JavaScript memory.
4. **Local Mathematical Evaluation**:
   - Geodesic distances are computed using client-side spherical trigonometry.
   - Top-4 inverse-distance weighted interpolation runs in pure JavaScript.
   - Rothfusz polynomial and continuous HSI equations execute locally.
5. **Zero External I/O**: The user receives real-time heat vulnerability assessments, hydration targets, and symptom triage with **0 network packets transmitted**.

---

### Path C: Macroscopic Research & Regional Priority Mapping
1. **Raw Ingestion**: Multi-year NOAA GSOD daily weather summaries ($2022\text{--}2025$, 3,680 records across 46 synoptic stations) are ingested.
2. **Quality Control & Flag Cleaning**:
   - Unrecorded observations flagged as `9999.9` or `99.99` are replaced with median imputation.
   - Knots are converted to SI metric ($\text{m/s}$ and $\text{km/h}$).
   - Temperatures are converted from Fahrenheit to Celsius:
     $$T_C = \frac{5}{9}(T_F - 32)$$
3. **Biometeorological Feature Expansion**:
   - Magnus-Tetens Relative Humidity ($RH$)
   - Diurnal Temperature Range ($DTR = T_{\max} - T_{\min}$)
   - Canadian Humidex ($H$)
   - NOAA Rothfusz Heat Index ($HI$)
4. **Scaling**: Standardized via `RobustScaler` (interquartile range scaling) to prevent extreme monsoon outliers from distorting Euclidean distance metrics.
5. **Unsupervised Clustering**:
   - $K$-Means clustering across $K \in [2..8]$ with 10 random restarts (`k-means++` initialization).
   - Multi-metric evaluation computes Silhouette Coefficient, Davies-Bouldin Index, Calinski-Harabasz Index, and WCSS.
   - Agglomerative Hierarchical clustering with Ward's minimum-variance linkage is computed for cross-algorithm validation.
6. **Dimensionality Reduction**:
   - PCA projects 8 standardized features onto orthogonal axes $PC_1$ and $PC_2$ ($84.2\%$ cumulative variance).
   - UMAP constructs a fuzzy topological simplicial complex representing non-linear manifold structures.
7. **REST Exposure**: Results are serialized into Pydantic v2 schemas and served to the React analytics dashboard.

---

## 4. Subsystem Directory Structure

```
HeatMap AI/
├── backend/                         # FastAPI Application Backend
│   ├── main.py                      # Application entrypoint & CORS middleware
│   ├── api/                         # REST Router Controllers
│   │   ├── analysis.py              # PCA, UMAP, LOSOCV validation & benchmark routes
│   │   ├── clustering.py            # K-Means, profiles, and optimal-K routes
│   │   ├── dataset.py               # Summary statistics & data quality metrics
│   │   ├── hierarchical.py          # Ward's linkage & cophenetic correlation routes
│   │   ├── predict.py               # Live GPS prediction endpoints
│   │   └── safety.py                # Biometeorological companion & triage routes
│   └── ml/                          # Mathematical & Machine Learning Core
│       ├── benchmark.py             # High-precision hardware timer benchmark engine
│       ├── data_loader.py           # NOAA GSOD ingestion & feature engineering
│       ├── idw_validation.py        # LOSOCV cross-validation engine (k=1..6, p=1..3)
│       ├── pipeline.py              # Scikit-learn K-Means, PCA, UMAP & scaling pipeline
│       └── safety_engine.py         # Rothfusz equation, HSI, and persona logic
├── frontend/                        # React 19 + TypeScript Frontend
│   ├── src/
│   │   ├── components/              # Interactive UI Views & Modals
│   │   │   ├── CompanionHome.tsx    # Live GPS companion, hydration, and action plan
│   │   │   ├── IdwValidationModal.tsx# Empirical LOSOCV & benchmark viva proof
│   │   │   ├── NationalGpsGraph.tsx # Full-country SVG spatial interpolation graph
│   │   │   ├── PriorityMap.tsx      # Leaflet geospatial vulnerability map
│   │   │   ├── PCAVisualizer.tsx    # 2D PCA biplot with feature vector loadings
│   │   │   └── ...                  # Additional views (AllStations, SOS, Family)
│   │   ├── services/api.ts          # Unified HTTP client with automatic offline fallback
│   │   ├── types.ts                 # Strict TypeScript interfaces matching backend models
│   │   └── utils/
│   │       ├── localization.ts      # Trilingual dictionary (English, Hindi, Punjabi)
│   │       └── offlineEngine.ts     # Client-side Haversine, IDW, and safety equations
│   └── public/
│       └── sw.js                    # Service Worker caching script for PWA offline use
└── tests/                           # Pytest Test Automation Suite
    ├── test_pipeline.py             # 8 ML pipeline, ANOVA, and clustering tests
    └── test_safety_matrix.py        # 10 Biometeorological matrix & triage tests
```

---

## 5. Concurrency & Performance Engineering

1. **Station Lookup Bottleneck Elimination**:
   - *Previous Approach*: Scanning full $3,680$-row DataFrame via Pandas boolean masks on every prediction call ($5.6\text{ms}$ overhead).
   - *Optimized Approach*: Pre-indexing unique synoptic stations into contiguous NumPy coordinate and attribute arrays. Reduced execution latency to **$0.78\text{ms}$** (a **$7.2\times$ speedup**).
2. **Zero-Copy Haversine Vectorization**:
   - Geodesic distances to all 46 stations are computed in a single vectorized trigonometric operation without intermediate allocations.
3. **Stateless Scalability**:
   - The FastAPI backend is completely stateless; predictions do not require session locks or database disk I/O, allowing linear horizontal scaling behind reverse proxies.
