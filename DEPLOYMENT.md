# HeatShield AI — Deployment Guide (Render, Vercel & Docker)

This guide covers deploying HeatShield AI across **Render** (Python/FastAPI ML backend), **Vercel** (React + Vite PWA frontend), and **Docker** (unified single-container deployment).

---

## Option 1: Deploy Backend on Render (ML Engine, Weather & Geo APIs)

Render provides persistent containers ideal for `scikit-learn`, `numpy`, `pandas`, `FastAPI`, and `Uvicorn`.

### 1-Click / Blueprint Deployment
1. Connect your GitHub repository in [Render Dashboard](https://dashboard.render.com) -> **New +** -> **Blueprint**.
2. Render automatically uses [`render.yaml`](./render.yaml):
   - **Runtime:** Python 3.12 (`3.12.10`)
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/api/health`
   - **Environment Variables:**
     - `PYTHONPATH=.`
     - `PYTHON_VERSION=3.12.10`
     - `TRUSTED_PROXY_IPS=127.0.0.1,::1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,100.64.0.0/10` (allows Render's reverse proxy to pass the real client IP to `/api/geo/ip` while blocking spoofed `X-Forwarded-For` headers from untrusted peers)

> **Optional Security Tightening:** Set `CORS_ALLOW_ORIGINS` on Render to your Vercel origin (e.g., `https://heat-map-ai.vercel.app`) if calling the Render URL directly via `VITE_API_URL`.

---

## Option 2: Deploy Frontend on Vercel

1. Import the GitHub repository into [Vercel](https://vercel.com) (Root Directory: `.` or `frontend`).
2. Framework Preset: **Vite** (`buildCommand`: `npm run build`, `outputDirectory`: `dist`).
3. [`vercel.json`](./vercel.json) and [`frontend/vercel.json`](./frontend/vercel.json) configure:
   - `/api/:path*` proxy rewrites to your Render backend URL.
   - Zero-stale-cache `Cache-Control: public, max-age=0, must-revalidate` headers on `/sw.js` and `/index.html`, plus immutable caching on hashed `/assets/*` bundles.
4. Optionally set `VITE_API_URL` in Vercel **Environment Variables** if pointing to a custom Render backend domain.

> **Cold-Start & Offline Resilience:** When the Render free-tier container wakes from sleep (~25–40s), the frontend acquires device GPS directly in the browser, queries Open-Meteo HTTPS live observations/forecasts with `&timezone=auto`, reverse-geocodes via BigDataCloud/Nominatim, and clearly labels NOAA GSOD IDW fallback data as `Offline Estimate` with `observed_at = null` if network connectivity is absent.

---

## Option 3: Unified Docker Deployment (Single Container)

To build and serve both the React SPA and FastAPI API from one container:
```bash
docker build -t heatshield-ai .
docker run -p 8000:8000 -e PORT=8000 \
  -e TRUSTED_PROXY_IPS="127.0.0.1,::1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,100.64.0.0/10" \
  heatshield-ai
```
*(Omit `TRUSTED_PROXY_IPS` when exposing the container directly without a reverse proxy so arbitrary `X-Forwarded-For` headers remain rejected.)*

---

## Pre-Deployment Verification Gate

Run all checks locally before pushing a release:
```bash
# Backend + Security + Weather + Geo Regression Tests (50 tests)
.venv\Scripts\python.exe -m pytest tests/ -v

# Frontend Lint & Production Build
cd frontend && npm run lint && npm run build

# Full Release Qualification Gate
cd .. && .venv\Scripts\python.exe scripts/release_validation.py
```
