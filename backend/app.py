"""
Model Monitoring API - Prototype.
Run from project root: python -m backend.app  or  flask --app backend.app run
"""

import sys
from pathlib import Path

# Paths: app.py lives in backend/, so parents[0]=backend, parents[1]=project root
BACKEND_DIR = Path(__file__).resolve().parents[0]
PROJECT_ROOT = Path(__file__).resolve().parents[1]
for p in (BACKEND_DIR, PROJECT_ROOT):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "model-monitoring"})


@app.route("/api/filter-options", methods=["GET"])
def filter_options():
    from store import get_filter_options
    return jsonify(get_filter_options())


@app.route("/api/models", methods=["GET"])
def list_models():
    """List all models for dropdowns (e.g. trend chart model selector)."""
    from store import get_models
    models = get_models()
    return jsonify({"models": models})


@app.route("/api/datasets", methods=["GET"])
def list_datasets():
    """List all ingested datasets for backend portal."""
    from store import datasets_store
    out = []
    for did, ds in datasets_store.items():
        meta = ds.get("metadata", {})
        data = ds.get("scored_data") or []
        row_count = len(data) if isinstance(data, list) else 0
        out.append({
            "dataset_id": did,
            "portfolio": meta.get("portfolio", ""),
            "model_type": meta.get("model_type", ""),
            "model_id": meta.get("model_id", ""),
            "vintage": meta.get("vintage", ""),
            "qc_status": ds.get("qc_status", "pending"),
            "row_count": row_count,
            "created_at": ds.get("created_at", ""),
        })
    return jsonify({"datasets": out})


@app.route("/api/metrics/trends", methods=["GET"])
def metrics_trends():
    """Get KS, PSI, volume, and bad_rate trend data for a single model (optional segment), with intelligent commentary."""
    model_id = request.args.get("model_id")
    segment = request.args.get("segment")
    if not model_id:
        return jsonify({"error": "model_id required"}), 400
    from store import get_metrics_trends
    from services.insights import generate_trend_commentary
    data = get_metrics_trends(model_id, segment=segment or None)
    if not data:
        return jsonify({"error": "model not found or no metrics"}), 404
    data["commentary"] = generate_trend_commentary(data)
    return jsonify(data)


@app.route("/api/metrics/variable-stability", methods=["GET"])
def variable_stability():
    """Variable-level stability (PSI per variable) for a model and vintage; includes PSI trigger insight."""
    model_id = request.args.get("model_id")
    vintage = request.args.get("vintage")
    if not model_id or not vintage:
        return jsonify({"error": "model_id and vintage required"}), 400
    from store import get_variable_stability
    data = get_variable_stability(model_id, vintage)
    driven_by = [v["variable"] for v in data if v.get("status") in ("amber", "red")]
    psi_trigger_insight = (
        f"PSI trigger is primarily driven by: {', '.join(driven_by)}."
        if driven_by else "All variables are within acceptable PSI range (green)."
    )
    return jsonify({
        "model_id": model_id,
        "vintage": vintage,
        "variables": data,
        "psi_trigger_insight": psi_trigger_insight,
    })


@app.route("/api/metrics/segments", methods=["GET"])
def segment_metrics():
    """Segment-level metrics for Acquisition Scorecard (thin file, thick file)."""
    model_id = request.args.get("model_id")
    vintage = request.args.get("vintage")
    if not model_id or not vintage:
        return jsonify({"error": "model_id and vintage required"}), 400
    from store import get_segment_metrics
    data = get_segment_metrics(model_id, vintage)
    if not data:
        return jsonify({"error": "not found or not an Acquisition Scorecard model"}), 404
    return jsonify(data)


@app.route("/api/metrics/summary", methods=["GET"])
def metrics_summary():
    portfolio = request.args.get("portfolio")
    model_type = request.args.get("model_type")
    vintage = request.args.get("vintage")
    segment = request.args.get("segment")
    from store import get_metrics
    rows = get_metrics(portfolio=portfolio, model_type=model_type, vintage=vintage, segment=segment or None)
    return jsonify({"metrics": rows})


@app.route("/api/metrics/detail/<model_id>", methods=["GET"])
def metrics_detail(model_id):
    vintage = request.args.get("vintage")
    segment = request.args.get("segment")
    if not vintage:
        return jsonify({"error": "vintage required"}), 400
    from store import get_metric_detail, get_decile_metrics
    from services.insights import generate_decile_commentary, generate_ks_trigger_insight
    detail = get_metric_detail(model_id, vintage, segment=segment or None)
    if not detail:
        return jsonify({"error": "not found"}), 404
    # Decile-level data and commentary (for scorecard-style models)
    deciles = get_decile_metrics(model_id, vintage, segment=segment or None)
    detail["deciles"] = deciles
    detail["decile_commentary"] = generate_decile_commentary(deciles)
    ks_val = detail.get("metrics", {}).get("KS")
    detail["ks_trigger_insight"] = generate_ks_trigger_insight(ks_val, deciles)
    # Add ML explainability placeholder for ML model type
    if detail.get("model_type") == "ML":
        from metrics.ml_explainability import get_feature_importance
        detail["explainability"] = {
            "feature_importance": get_feature_importance(["F1", "F2", "F3", "F4", "F5"]),
            "importance_drift": 0.08,
        }
    return jsonify(detail)


@app.route("/api/ingest", methods=["POST"])
def ingest_data():
    body = request.get_json() or {}
    portfolio = body.get("portfolio") or request.args.get("portfolio")
    model_type = body.get("model_type") or request.args.get("model_type")
    model_id = body.get("model_id") or request.args.get("model_id")
    vintage = body.get("vintage") or request.args.get("vintage")
    data = body.get("data", [])
    if not all([portfolio, model_type, model_id, vintage]):
        return jsonify({"error": "portfolio, model_type, model_id, vintage required"}), 400
    from services.ingestion import ingest
    result = ingest(data, portfolio, model_type, model_id, vintage)
    return jsonify(result)


@app.route("/api/qc/<dataset_id>", methods=["POST"])
def run_qc(dataset_id):
    from store import datasets_store
    if dataset_id not in datasets_store:
        return jsonify({"error": "dataset not found"}), 404
    recs = datasets_store[dataset_id].get("scored_data") or []
    from services.qc import run_qc as qc_run
    required = request.get_json() or {}
    required_cols = required.get("required_columns", [])
    result = qc_run(recs, required_columns=required_cols)
    return jsonify(result)


@app.route("/api/compute-metrics", methods=["POST"])
def compute_metrics():
    """
    Compute metrics for a dataset. Body: dataset_id, model_type, optional baseline_scores.
    For prototype we append to metrics_store with model metadata from dataset.
    """
    body = request.get_json() or {}
    dataset_id = body.get("dataset_id")
    model_type = body.get("model_type")
    from store import datasets_store, save_metrics
    if not dataset_id or dataset_id not in datasets_store:
        return jsonify({"error": "dataset_id not found"}), 404
    ds = datasets_store[dataset_id]
    meta = ds["metadata"]
    data = ds.get("scored_data") or []
    if not data or not isinstance(data, list):
        return jsonify({"error": "no scored data"}), 400
    # Expect records with 'target' and 'score' or 'probability'
    import numpy as np
    y_true = np.array([r.get("target", r.get("y", 0)) for r in data])
    y_score = np.array([r.get("score", r.get("probability", 0.5)) for r in data])
    baseline = body.get("baseline_scores")
    y_baseline = np.array(baseline) if baseline else None
    model_type = model_type or meta.get("model_type", "Acquisition Scorecard")
    if model_type in ("Acquisition Scorecard", "ECM Scorecard", "Bureau", "ML"):
        from metrics.scorecard_metrics import compute_scorecard_metrics
        metrics = compute_scorecard_metrics(y_true, y_score, y_baseline)
    elif model_type == "Fraud":
        from metrics.fraud_metrics import compute_fraud_metrics
        metrics = compute_fraud_metrics(y_true, y_score, y_baseline_proba=y_baseline)
    elif model_type == "Collections":
        from metrics.collections_metrics import compute_collections_metrics
        metrics = compute_collections_metrics()
    else:
        from metrics.scorecard_metrics import compute_scorecard_metrics
        metrics = compute_scorecard_metrics(y_true, y_score, y_baseline)
    from datetime import datetime
    record = {
        "model_id": meta.get("model_id", "unknown"),
        "portfolio": meta.get("portfolio", ""),
        "model_type": model_type,
        "vintage": meta.get("vintage", ""),
        "computed_at": datetime.utcnow().isoformat() + "Z",
        "metrics": metrics,
        "volume": len(data),
    }
    save_metrics(record)
    return jsonify(record)


@app.route("/api/dataset/<dataset_id>", methods=["GET"])
def get_dataset(dataset_id):
    """Get dataset status for workflow UI (metadata, qc_status, has_scores)."""
    from store import datasets_store
    if dataset_id not in datasets_store:
        return jsonify({"error": "dataset not found"}), 404
    ds = datasets_store[dataset_id]
    data = ds.get("scored_data") or []
    has_scores = (
        isinstance(data, list)
        and len(data) > 0
        and any(
            r.get("score") is not None or r.get("probability") is not None
            for r in (data[:100] if len(data) > 100 else data)
        )
    )
    return jsonify({
        "dataset_id": dataset_id,
        "metadata": ds.get("metadata", {}),
        "qc_status": ds.get("qc_status", "pending"),
        "row_count": len(data) if isinstance(data, list) else 0,
        "has_scores": has_scores,
    })


@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Answer questions about model performance. Accepts { "message": "..." }.
    Uses in-memory metrics for context; optionally calls OpenAI if OPENAI_API_KEY is set.
    """
    body = request.get_json() or {}
    message = (body.get("message") or "").strip()
    if not message:
        return jsonify({"error": "message required"}), 400

    from store import get_metrics, get_models, get_filter_options
    import os

    # Build context from store for the bot
    metrics = get_metrics()
    models = get_models()
    options = get_filter_options()

    # Portfolio-level counts
    by_portfolio = {}
    for m in metrics:
        port = m.get("portfolio") or "Other"
        by_portfolio[port] = by_portfolio.get(port, 0) + 1

    def status_from_metrics(m):
        ks = m.get("metrics", {}).get("KS")
        psi = m.get("metrics", {}).get("PSI")
        if ks is None:
            ks = 0
        if psi is None:
            psi = 1
        if ks >= 0.3 and psi < 0.2:
            return "green"
        if ks >= 0.2 and psi < 0.25:
            return "amber"
        return "red"

    status_counts = {"green": 0, "amber": 0, "red": 0}
    by_status = {"green": [], "amber": [], "red": []}
    by_portfolio_status = {}
    for m in metrics:
        s = status_from_metrics(m)
        status_counts[s] += 1
        by_status[s].append(m.get("model_id"))
        port = m.get("portfolio") or "Other"
        if port not in by_portfolio_status:
            by_portfolio_status[port] = {"green": 0, "amber": 0, "red": 0}
        by_portfolio_status[port][s] += 1

    models_with_metrics = {}
    for m in metrics:
        mid = m.get("model_id")
        if mid and (mid not in models_with_metrics or (m.get("vintage") or "") > (models_with_metrics[mid].get("vintage") or "")):
            models_with_metrics[mid] = m

    context = {
        "total_metrics_rows": len(metrics),
        "total_models": len(models),
        "portfolios": list(options.get("portfolios", [])),
        "model_types": list(options.get("model_types", [])),
        "by_portfolio_count": by_portfolio,
        "status_counts": status_counts,
        "by_status_models": {k: list(set(v)) for k, v in by_status.items()},
        "by_portfolio_status": by_portfolio_status,
        "models_with_metrics": [
            {"model_id": m.get("model_id"), "portfolio": m.get("portfolio"), "model_type": m.get("model_type"),
             "vintage": m.get("vintage"), "KS": m.get("metrics", {}).get("KS"), "PSI": m.get("metrics", {}).get("PSI"),
             "status": status_from_metrics(m)}
            for m in list(models_with_metrics.values())[:20]
        ],
    }

    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            system = (
                "You are an expert Model Performance assistant for a banking model monitoring dashboard. "
                "Answer clearly and concisely using the context below. Be specific with numbers when available.\n\n"
                "Metrics: KS = Kolmogorov-Smirnov (discrimination, higher better). "
                "PSI = Population Stability Index (score stability, lower better). "
                "RAG: Green = KS >= 0.3 and PSI < 0.2; Amber = KS 0.2-0.3 or PSI 0.2-0.25; Red = needs attention.\n\n"
                "Context:\n" + str(context)
            )
            resp = client.chat.completions.create(
                model=os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": message},
                ],
                max_tokens=500,
            )
            reply = (resp.choices[0].message.content or "").strip()
            return jsonify({"reply": reply})
        except ImportError:
            reply = _rule_based_reply(message, context)
            return jsonify({"reply": reply})
        except Exception as e:
            return jsonify({"reply": f"I couldn't use the AI service: {e}. Here's a quick answer from the data: " + _rule_based_reply(message, context)})

    reply = _rule_based_reply(message, context)
    return jsonify({"reply": reply})


def _rule_based_reply(message: str, context: dict) -> str:
    """Generate an intuitive reply from context without an LLM."""
    q = message.lower().strip()
    total = context.get("total_metrics_rows", 0)
    models_count = context.get("total_models", 0)
    status = context.get("status_counts", {})
    by_port = context.get("by_portfolio_count", {})
    by_status_models = context.get("by_status_models", {})
    by_port_status = context.get("by_portfolio_status", {})
    models_list = context.get("models_with_metrics", [])

    g, a, r = status.get("green", 0), status.get("amber", 0), status.get("red", 0)
    total_status = g + a + r

    if not q or q in ("hi", "hello", "hey"):
        return (
            f"Hi! I'm your model performance assistant. There are {models_count} models in the current view. "
            f"Status: {g} Green, {a} Amber, {r} Red. "
            "Ask me: 'Which models need attention?', 'What is KS?', 'Compare portfolio performance', or 'How does RAG work?'"
        )
    if "help" in q or "what can" in q or "suggest" in q:
        return (
            "I can help with:\n"
            "• **Status** – Which models are Green/Amber/Red, or need attention\n"
            "• **Metrics** – What KS, PSI, and RAG thresholds mean\n"
            "• **Portfolios** – Compare performance across Retail, Corporate, SME\n"
            "• **Trends** – Use the Analysis tab for Volume, KS, and PSI deep dives\n"
            "Try: 'Which models are red?', 'Explain RAG status', or 'Retail portfolio health'"
        )
    if ("how many" in q or "count" in q) and ("model" in q or "metric" in q):
        return f"There are **{models_count} models** and {total} metric records. Status: {g} Green, {a} Amber, {r} Red. Use Filters to narrow by portfolio or vintage."
    if "which" in q and ("red" in q or "attention" in q or "need" in q or "problem" in q):
        red_list = by_status_models.get("red", [])
        if red_list:
            return f"Models needing attention (Red): {', '.join(red_list[:10])}{'...' if len(red_list) > 10 else ''}. These have KS < 0.2 or PSI > 0.25. Use the Analysis tab for decile and variable-level deep dives."
        return "No Red models in the current view. All models are Green or Amber."
    if "which" in q and ("amber" in q or "review" in q):
        amber_list = by_status_models.get("amber", [])
        if amber_list:
            return f"Models under review (Amber): {', '.join(amber_list[:10])}. These have KS 0.2–0.3 or PSI 0.2–0.25. Check the Summary table and Analysis tab for details."
        return "No Amber models. All are Green or Red."
    if "portfolio" in q and ("list" in q or "which" in q or "what" in q or "all" in q):
        ports = context.get("portfolios", [])
        return f"Portfolios: {', '.join(ports) if ports else 'None'}." + (
            f"\n\nPer-portfolio status: " + ", ".join(
                f"{p}: {s.get('green', 0)}G/{s.get('amber', 0)}A/{s.get('red', 0)}R"
                for p, s in by_port_status.items()
            ) if by_port_status else ""
        )
    if "compare" in q and "portfolio" in q:
        if not by_port_status:
            return "No portfolio-level data available. Apply Filters and try again."
        lines = [f"**{port}**: Green {s.get('green', 0)}, Amber {s.get('amber', 0)}, Red {s.get('red', 0)}" for port, s in by_port_status.items()]
        return "Portfolio RAG comparison:\n" + "\n".join(lines)
    if "rag" in q or ("status" in q and ("meaning" in q or "mean" in q or "work" in q)):
        return (
            "**RAG status** (Red–Amber–Green):\n"
            "• **Green**: KS ≥ 0.3 and PSI < 0.2 — healthy discrimination and stable scores\n"
            "• **Amber**: KS 0.2–0.3 or PSI 0.2–0.25 — review recommended\n"
            "• **Red**: KS < 0.2 or PSI > 0.25 — needs attention\n"
            f"Current view: {g} Green, {a} Amber, {r} Red."
        )
    if "green" in q or "amber" in q or "red" in q:
        return f"RAG breakdown: **Green {g}**, **Amber {a}**, **Red {r}**. Green = good; Amber = review; Red = attention needed. Use the Portfolio pie chart and Summary for details."
    if "ks" in q or "kolmogorov" in q:
        return "**KS (Kolmogorov-Smirnov)** measures how well the model separates good vs bad. Higher is better (≥ 0.3 = Green). See the Summary table and Analysis tab for trend charts."
    if "psi" in q or "stability" in q or "population stability" in q:
        return "**PSI (Population Stability Index)** measures score drift vs baseline. Lower is better (< 0.2 = Green; > 0.25 = Red). Use Variable-level stability for per-variable PSI."
    if "retail" in q or "corporate" in q or "sme" in q:
        for port, count in by_port.items():
            if port.lower() in q[:6]:
                s = by_port_status.get(port, {})
                return f"**{port}** has {count} metric records. Status: {s.get('green', 0)} Green, {s.get('amber', 0)} Amber, {s.get('red', 0)} Red."
        return f"Portfolios: {dict(by_port)}. Select one in Filters to see its status."
    if "status" in q or "health" in q:
        return f"Overall model health: **Green {g}**, **Amber {a}**, **Red {r}**. Green = healthy; Red = needs action. Check the Portfolio summary pie chart for the distribution."
    if "trend" in q or "volume" in q or "decile" in q:
        return "For Volume, KS, and PSI trends, open the **Analysis** tab. Select a model and click Load analysis to see charts, decile-level KS reasons, and variable-level PSI."
    if "best" in q or "worst" in q:
        if models_list:
            by_ks = sorted(models_list, key=lambda x: (x.get("KS") or 0), reverse=True)
            best = by_ks[0] if by_ks else {}
            worst = by_ks[-1] if by_ks else {}
            return f"By KS: Best = {best.get('model_id', '?')} (KS {best.get('KS', '–')}); Worst = {worst.get('model_id', '?')} (KS {worst.get('KS', '–')}). Use Summary or Analysis for full details."
        return "Insufficient data to rank. Apply Filters and ensure metrics are loaded."
    return (
        f"I have data for {models_count} models ({g} Green, {a} Amber, {r} Red). "
        "Try: 'Which models need attention?', 'What is RAG?', 'Compare portfolios', or 'Explain KS and PSI'. "
        "For trend and decile analysis, use the Analysis tab."
    )


@app.route("/api/score-dataset/<dataset_id>", methods=["POST"])
def score_dataset(dataset_id):
    """
    Mock scoring: if records have target/y but no score/probability,
    add a synthetic score so compute-metrics can run. (Prototype only.)
    """
    from store import datasets_store
    import random
    if dataset_id not in datasets_store:
        return jsonify({"error": "dataset not found"}), 404
    ds = datasets_store[dataset_id]
    data = ds.get("scored_data") or []
    if not isinstance(data, list) or not data:
        return jsonify({"error": "no data to score"}), 400
    updated = []
    random.seed(hash(dataset_id) % (2**32))
    for r in list(data):
        rec = dict(r)
        if rec.get("score") is None and rec.get("probability") is None:
            t = rec.get("target", rec.get("y", 0))
            # Mock: score slightly higher for target=1
            rec["score"] = round(0.3 + 0.4 * t + random.random() * 0.3, 4)
            rec["probability"] = rec["score"]
        updated.append(rec)
    ds["scored_data"] = updated
    return jsonify({
        "dataset_id": dataset_id,
        "status": "scored",
        "row_count": len(updated),
    })


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV", "development") != "production"
    app.run(host="0.0.0.0", port=port, debug=debug)
