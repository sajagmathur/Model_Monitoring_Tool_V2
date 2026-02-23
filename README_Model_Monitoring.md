# Model Monitoring – Banking Prototype

Prototype for a **Model Monitoring** solution for Banking: Acquisition, ECM, Scorecard, Collections, Fraud, and ML models.

## What’s included

- **Backend (Flask)**  
  - Data ingestion, QC, and metrics computation (KS, PSI, AUC, CA, fraud/collections/ML metrics).  
  - APIs: filter options, metrics summary, metrics detail (with ML explainability for ML models).  
- **Frontend (HTML/CSS/JS)**  
  - Filters: Portfolio, Model type, Vintage.  
  - Summary table of model performance (KS, PSI, AUC, CA@10, other).  
  - Detail view per model (and ML explainability for ML type).  
- **Seed data**  
  - Sample models and precomputed metrics so the UI works out of the box.

## How to run

### 1. Install dependencies

From the **project root** (folder containing `backend` and `frontend`):

```bash
pip install -r requirements.txt
```

### 2. Start the backend

From the **project root**:

```bash
cd backend
python app.py
```

The API will be at **http://127.0.0.1:5000**.

- Health: `GET http://127.0.0.1:5000/health`  
- Filter options: `GET http://127.0.0.1:5000/api/filter-options`  
- Summary: `GET http://127.0.0.1:5000/api/metrics/summary?portfolio=Retail&vintage=2024-01`  
- Detail: `GET http://127.0.0.1:5000/api/metrics/detail/ML-RET-001?vintage=2024-01`

### 3. Open the frontend

- Option A: Open `frontend/index.html` in a browser (file://).  
- Option B: Serve the frontend (e.g. `python -m http.server 8080` from the `frontend` folder) and open `http://127.0.0.1:8080`.

If the frontend is not on the same origin as the API, ensure the backend is running and CORS is enabled (already set in the prototype).

## Project layout

```
Stress AI/
├── backend/
│   ├── app.py              # Flask API
│   ├── store.py            # In-memory store + seed data
│   ├── metrics/            # KS, PSI, AUC, CA, scorecard, fraud, collections, ML explainability
│   └── services/           # Ingestion, QC
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── ks_logistic_model.py    # Existing KS logic (used by backend)
└── requirements.txt
```

## API summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/filter-options` | GET | Portfolios, model types, vintages |
| `/api/metrics/summary` | GET | Metrics list (query: portfolio, model_type, vintage) |
| `/api/metrics/detail/<model_id>` | GET | Full metrics + explainability for ML (query: vintage) |
| `/api/ingest` | POST | Ingest data (body: portfolio, model_type, model_id, vintage, data) |
| `/api/qc/<dataset_id>` | POST | Run QC (body: optional required_columns) |
| `/api/compute-metrics` | POST | Compute and store metrics (body: dataset_id, model_type, optional baseline_scores) |

## Model types and metrics

- **Acquisition / ECM / Bureau / ML (classification):** KS, PSI, AUC, CA@10, Gini.  
- **Collections:** Roll rate, flow rate, recovery rate, cure rate.  
- **Fraud:** KS, PSI, AUC, AUC-PR, CA@10, precision@5, alert rate, FPR, fraud rate in alerts.  
- **ML:** Same as scorecard + feature importance and importance drift (explainability).

---

## Quick run (PowerShell)

1. **Install Python** (if needed) from [python.org](https://www.python.org/) and run `pip install -r requirements.txt` from the project root.
2. **Start backend:** `.\run_backend.ps1` — API at http://127.0.0.1:5000
3. **Start frontend:** In a second terminal, `.\run_frontend.ps1` — UI at http://127.0.0.1:8080
4. Open **http://127.0.0.1:8080** in your browser.

## Expected output when running

- **Browser (http://127.0.0.1:8080):**  
  - Header: "Model Monitoring" with subtitle "Banking – Acquisition, ECM, Scorecard, Collections, Fraud, ML".  
  - **Filters:** Portfolio (All / Retail, Corporate, SME), Model type (All / Acquisition Scorecard, ECM Scorecard, Bureau, Collections, Fraud, ML), Vintage (All / 2024-01 … 2024-05), and an Apply button.  
  - **Summary table:** Rows for each model+vintage with columns Model ID, Portfolio, Model type, Vintage, KS, PSI, AUC, CA@10%, Other metrics, and a "Detail" button. Seed data shows models like ACQ-RET-001, ECM-RET-001, BUR-SME-001, COL-RET-001, FRD-001, ML-RET-001 across vintages 2024-01, 2024-02, 2024-03.  
  - Clicking **Detail** opens a detail panel with all metrics for that model and vintage; for ML models, a "Feature importance" section with top drivers and importance drift is shown.

- **Backend terminal:** Flask logs such as `* Running on http://0.0.0.0:5000` and `GET /api/filter-options`, `GET /api/metrics/summary?...` on each filter apply or page load.
