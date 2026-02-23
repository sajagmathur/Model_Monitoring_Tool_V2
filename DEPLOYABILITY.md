# Deployability Assessment – Model Monitoring (Stress AI)

## Summary

**Current state: prototype / dev-only.** The app runs well locally with two processes (backend + frontend). It is **not production-ready** as-is but can be made deployable with a small set of changes.

---

## What’s already okay

| Area | Status |
|------|--------|
| **Backend binding** | `host="0.0.0.0"` – listens on all interfaces, fine for containers/servers |
| **CORS** | Enabled via `flask-cors` – can be tightened later with an allowed-origins list |
| **Dependencies** | `requirements.txt` present (Flask, numpy, pandas, etc.) |
| **API design** | REST-style endpoints; no hardcoded secrets in code (OpenAI key from env) |
| **Frontend** | Static HTML/JS/CSS – easy to serve from any web server or from Flask |

---

## Gaps for deployment

### 1. **Frontend API URL**

- **Issue:** `API_BASE = 'http://127.0.0.1:5000'` is hardcoded in `frontend/app.js` and `frontend/backend-portal.html`.
- **Effect:** When the UI is served from another host/domain (e.g. `https://app.company.com`), the browser still calls `http://127.0.0.1:5000` and requests fail.
- **Fix:** Make the API base configurable (e.g. env at build time, or a small `config.js` / inline script that sets `window.API_BASE`). For single-host deployment, use a relative path like `/api` and put a reverse proxy in front.

### 2. **Backend run mode**

- **Issue:** `app.run(..., debug=True)` – Flask dev server, single process, no production WSGI.
- **Effect:** Not suitable for production load or reliability.
- **Fix:** Run with **Gunicorn** (or similar):  
  `gunicorn -w 4 -b 0.0.0.0:5000 "backend.app:app"`  
  Use `FLASK_ENV=production` or an env var to turn off `debug` when running the app.

### 3. **Data persistence**

- **Issue:** All data is in-memory (`store.py`: `metrics_store`, `datasets_store`, `models_registry`). Restart = data loss.
- **Effect:** Fine for demos; unacceptable for any real deployment where uploads/metrics must survive restarts.
- **Fix:** Introduce a real store (e.g. SQLite/PostgreSQL for metadata and metrics, object storage or DB for dataset payloads) and keep the same API surface.

### 4. **No container / orchestration**

- **Issue:** No Dockerfile or docker-compose; no Kubernetes/cloud config.
- **Effect:** Manual setup on each server; environment differences between dev and prod.
- **Fix:** Add a Dockerfile (and optionally docker-compose) that builds frontend and runs the backend (and serves static files from Flask or nginx). Optionally add a simple health-check.

### 5. **HTTPS and security**

- **Issue:** No TLS; no explicit security headers or rate limiting.
- **Effect:** For production you’d typically terminate HTTPS at a reverse proxy and add auth (e.g. SSO, API keys).
- **Fix:** Put the app behind a reverse proxy (nginx, Caddy, or cloud load balancer) for HTTPS and auth; keep Flask as the app server.

### 6. **Chatbot / OpenAI**

- **Issue:** Optional; if used, `OPENAI_API_KEY` must be set in the environment.
- **Effect:** Works when key is set; no key = rule-based fallback. No key in code – good.

---

## Deployment options (by effort)

### A. **Single-server, quick**

1. Set `API_BASE` from environment (e.g. build-time or runtime config) to your backend URL.
2. Run backend with Gunicorn:  
   `gunicorn -w 4 -b 0.0.0.0:5000 "backend.app:app"`.
3. Serve frontend from the same machine (nginx or Flask static) and point the UI to the backend (same host or full URL).
4. Put nginx (or similar) in front for HTTPS and, if needed, auth.

**Result:** Deployable on one VM or bare metal; data still in-memory (resets on restart).

### B. **Single-server + persistence**

- Do (A), plus replace in-memory stores with a DB (e.g. SQLite for dev, PostgreSQL for prod) and optional file/object storage for datasets.
- No change to frontend/API contract if the store layer is kept behind the existing functions.

**Result:** Survives restarts; suitable for small teams / internal tools.

### C. **Containerized**

- Add a Dockerfile: install deps, run backend (Gunicorn) and serve frontend (e.g. copy static into image and serve from Flask or a small nginx).
- Use one image or two (backend + frontend) and set `API_BASE` so the frontend talks to the backend (e.g. via service name in docker-compose).
- Add docker-compose for local “production-like” runs.

**Result:** Portable, consistent environments; easy to move to a cloud container service.

### D. **Cloud (e.g. Azure App Service, AWS ECS, GCP Run)**

- Use (C) and push the image to a registry; run as a web service with env vars for `API_BASE`, `OPENAI_API_KEY`, DB URL, etc.
- Use managed DB and secrets; keep stateless app processes.

**Result:** Scalable, managed deployment with persistence and HTTPS.

---

## Minimal changes to improve deployability

1. **Configurable API base (frontend)**  
   - Read backend URL from `window.__CONFIG__` or a tiny `config.js` so one build can target different environments.

2. **Backend: port and debug from env**  
   - e.g. `port = int(os.environ.get("PORT", 5000))`, `debug = os.environ.get("FLASK_ENV") != "production"`.

3. **Serve frontend from Flask in one process**  
   - Optional: in production, serve `frontend/` as static files from Flask and use a single URL; API at `/api/*` and set `API_BASE = ""` or relative `/api` so the same origin is used.

4. **Add Gunicorn to requirements**  
   - So production runs with:  
     `gunicorn -w 4 -b 0.0.0.0:$PORT "backend.app:app"`.

5. **Optional: Dockerfile**  
   - Single image that runs the backend and serves the frontend; document in README.

After these, the app is **deployable** for internal or single-server use; adding persistence and HTTPS makes it **production-ready** for real workloads.
