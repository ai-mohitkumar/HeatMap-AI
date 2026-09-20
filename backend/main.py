"""
FastAPI Application Entry Point for HeatMap AI Backend Service
Regional Heat-Stress Vulnerability Profiles for Priority Mapping Through Clustering (SIH26083)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.api.dataset import router as dataset_router
from backend.api.clustering import router as clustering_router
from backend.api.hierarchical import router as hierarchical_router
from backend.api.analysis import router as analysis_router
from backend.api.temporal import router as temporal_router
from backend.api.report import router as report_router
from backend.api.safety import router as safety_router
from backend.api.climate_intelligence import router as climate_router
from backend.api.geo import router as geo_router
from backend.ml.pipeline import get_pipeline

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Eagerly initialize and pre-calculate the machine learning pipeline on startup
    print("[INFO] Initializing HeatShield AI ML Pipeline with NOAA GSOD dataset...")
    pipeline = get_pipeline()
    print(f"[READY] ML Pipeline ready! Ingested {len(pipeline.processed_df)} observations across {pipeline.processed_df['STATION'].nunique()} stations.")
    print(f"[READY] Optimal K recommended: K={pipeline.active_k}")
    yield

app = FastAPI(
    title="HeatShield AI — Regional Heat-Stress Vulnerability Intelligence API",
    description="Production AI/ML REST API for NOAA GSOD unsupervised clustering, PCA & UMAP visualisations, multi-year temporal tracking, and regional priority mapping (SIH26083).",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend (Vite port 5173 / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(dataset_router)
app.include_router(clustering_router)
app.include_router(hierarchical_router)
app.include_router(analysis_router)
app.include_router(temporal_router)
app.include_router(report_router)
app.include_router(safety_router)
app.include_router(climate_router)
app.include_router(geo_router)

@app.get("/api/health")
def health_check():
    return {
        "service": "HeatMap AI API",
        "project": "Regional Heat-Stress Vulnerability Profiles for Priority Mapping Through Clustering",
        "mapped_id": "SIH26083",
        "status": "healthy"
    }

from backend.api.safety import LocationPredictionRequest
from backend.ml.safety_engine import HeatSafetyEngine

@app.post("/api/predict/location")
def predict_location_direct(payload: LocationPredictionRequest):
    pipeline = get_pipeline()
    df = pipeline.processed_df
    return HeatSafetyEngine.predict_location_heat_risk(
        user_lat=payload.latitude,
        user_lon=payload.longitude,
        df=df,
        accuracy_m=payload.accuracy_m,
        mode=payload.mode or "online",
        k=4,
        p=2.0,
        profiles_list=pipeline.profiles
    )


# If production frontend build exists, mount static files
import os
from fastapi.staticfiles import StaticFiles

dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "service": "HeatMap AI API",
            "project": "Regional Heat-Stress Vulnerability Profiles for Priority Mapping Through Clustering",
            "mapped_id": "SIH26083",
            "status": "healthy",
            "endpoints": {
                "docs": "/docs",
                "dataset_summary": "/api/dataset/summary",
                "evaluations": "/api/clustering/evaluations",
                "optimal_k": "/api/clustering/optimal-k",
                "profiles": "/api/clustering/profiles",
                "hierarchical": "/api/hierarchical/comparison",
                "pca": "/api/analysis/pca",
                "map_stations": "/api/analysis/map-stations"
            }
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
