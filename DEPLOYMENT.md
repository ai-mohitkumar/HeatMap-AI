# HeatShield AI — Deployment Guide (Render & Vercel)

This guide provides end-to-end instructions for deploying HeatShield AI across **Render** (dedicated Python/Docker backend) and **Vercel** (high-performance React SPA with optional serverless Python functions).

---

## 🚀 Option 1: Deploy Backend on Render (Recommended for ML & RQ1–6)

Render provides persistent containers without serverless cold-start limitations, making it ideal for the complete scientific stack (`scikit-learn`, `numpy`, `pandas`, `FastAPI`, `Uvicorn`).

### 1-Click / Blueprint Deployment
1. Push your repository to GitHub: `https://github.com/<your-username>/HeatMap-AI`
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **New +** &rarr; **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect [`render.yaml`](./render.yaml) and configure:
   - **Service Type:** Web Service
   - **Name:** `heatshield-ai-backend`
   - **Runtime:** Python 3.12
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/api/health`
6. Click **Apply**. Once deployed, Render will provide a live URL (e.g. `https://heatshield-ai-backend.onrender.com`).

### Manual Web Service Setup (Alternative)
- **Environment:** Python
- **Region:** Any (e.g., Oregon or Frankfurt)
- **Branch:** `main`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables:**
  - `PYTHONPATH`: `.`
  - `PYTHON_VERSION`: `3.12.10`

---

## ⚡ Option 2: Deploy Frontend on Vercel

### Deploying the React SPA:
1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build` (or `node scripts/vercel-build.js`).
4. Output Directory: `dist`.
5. Under **Environment Variables**, set:
   - `VITE_API_URL`: `https://heatshield-ai-backend.onrender.com` (your Render backend URL)
6. Click **Deploy**.

> **Note on Cold Starts**: Render's free tier spins down web services after 15 minutes of inactivity. When spinning up, the frontend automatically falls back to authentic pre-calculated scientific models (`OFFLINE_RESEARCH_DATA` and `offlineClimateIntelligence`) with 0ms latency, and automatically seamlessly switches to live data once the backend responds.

---

## 🌐 Option 3: Unified Full-Stack on Vercel (Serverless Python)

HeatShield AI includes an ASGI serverless handler [`api/index.py`](./api/index.py) and [`vercel.json`](./vercel.json) rewrites:
- Any request to `/api/*` is routed directly to `api/index.py` via Vercel's Python Serverless Runtime.
- All non-API routes serve the SPA (`index.html`).

---

## 🐳 Option 4: Unified Docker Deployment (Single Container)

To host both the frontend and backend together in a single container on Render or Google Cloud Run:
```bash
docker build -t heatshield-ai .
docker run -p 8000:8000 -e PORT=8000 heatshield-ai
```
The Docker container builds the frontend into `frontend/dist` and FastAPI serves both the static web app and all `/api/*` endpoints from a single port.
