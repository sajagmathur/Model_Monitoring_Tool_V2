"""
In-memory store for prototype: model registry, datasets, and computed metrics.
"""

from datetime import datetime
from typing import Any, Optional

# Model types supported
MODEL_TYPES = [
    "Acquisition Scorecard",
    "ECM Scorecard",
    "Bureau",
    "Collections",
    "Fraud",
    "ML",
]

# Seed portfolios and vintages
PORTFOLIOS = ["Retail", "Corporate", "SME"]
VINTAGES = ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05"]

# In-memory stores
models_registry: list[dict] = []
datasets_store: dict[str, dict] = {}  # dataset_id -> { metadata, qc_status, scored_data }
metrics_store: list[dict] = []  # list of { model_id, portfolio, model_type, vintage, metrics, computed_at }


def _seed_models():
    """Seed model registry with sample models."""
    names = [
        ("ACQ-RET-001", "Retail", "Acquisition Scorecard"),
        ("ECM-RET-001", "Retail", "ECM Scorecard"),
        ("BUR-SME-001", "SME", "Bureau"),
        ("COL-RET-001", "Retail", "Collections"),
        ("FRD-001", "Retail", "Fraud"),
        ("ML-RET-001", "Retail", "ML"),
    ]
    for i, (mid, port, mtype) in enumerate(names):
        models_registry.append({
            "model_id": mid,
            "portfolio": port,
            "model_type": mtype,
            "name": f"{mtype} - {port}",
        })


def _seed_metrics():
    """Seed metrics store with sample computed metrics for demo."""
    import random
    random.seed(42)
    for m in models_registry:
        # Acquisition Scorecard: two rows per vintage (thin_file, thick_file)
        vintages = VINTAGES[:5]
        segments_for_model = [("thin_file", "Thin file"), ("thick_file", "Thick file")] if m["model_type"] == "Acquisition Scorecard" else [(None, None)]
        for v in vintages:
            for seg_key, _ in segments_for_model:
                base = {
                    "model_id": m["model_id"],
                    "portfolio": m["portfolio"],
                    "model_type": m["model_type"],
                    "vintage": v,
                    "segment": seg_key,
                    "computed_at": datetime.utcnow().isoformat() + "Z",
                }
                base["volume"] = int(5000 + random.random() * 45000)
                if m["model_type"] in ("Acquisition Scorecard", "ECM Scorecard", "Bureau", "ML"):
                    base["metrics"] = {
                        "KS": round(0.2 + random.random() * 0.25, 4),
                        "PSI": round(0.05 + random.random() * 0.15, 4),
                        "AUC": round(0.65 + random.random() * 0.25, 4),
                        "Gini": round(0.3 + random.random() * 0.5, 4),
                        "bad_rate": round(0.05 + random.random() * 0.15, 4),
                    }
                elif m["model_type"] == "Collections":
                    base["metrics"] = {
                        "roll_rate_30": round(0.02 + random.random() * 0.08, 4),
                        "flow_rate": round(0.1 + random.random() * 0.2, 4),
                        "recovery_rate": round(0.15 + random.random() * 0.25, 4),
                        "cure_rate": round(0.2 + random.random() * 0.3, 4),
                    }
                elif m["model_type"] == "Fraud":
                    base["metrics"] = {
                        "KS": round(0.3 + random.random() * 0.2, 4),
                        "PSI": round(0.05 + random.random() * 0.1, 4),
                        "AUC": round(0.75 + random.random() * 0.2, 4),
                        "AUC_PR": round(0.1 + random.random() * 0.3, 4),
                        "precision_at_5": round(0.1 + random.random() * 0.2, 4),
                        "alert_rate": round(0.02 + random.random() * 0.05, 4),
                        "fpr_at_threshold": round(0.01 + random.random() * 0.03, 4),
                        "bad_rate": round(0.01 + random.random() * 0.05, 4),
                    }
                metrics_store.append(base)


def get_models(
    portfolio: Optional[str] = None,
    model_type: Optional[str] = None,
) -> list[dict]:
    """Get models from registry with optional filters."""
    out = list(models_registry)
    if portfolio:
        out = [m for m in out if m["portfolio"] == portfolio]
    if model_type:
        out = [m for m in out if m["model_type"] == model_type]
    return out


def get_metrics(
    portfolio: Optional[str] = None,
    model_type: Optional[str] = None,
    vintage: Optional[str] = None,
    segment: Optional[str] = None,
) -> list[dict]:
    """Get computed metrics with optional filters (segment: thin_file, thick_file, or None for all)."""
    out = list(metrics_store)
    if portfolio:
        out = [m for m in out if m["portfolio"] == portfolio]
    if model_type:
        out = [m for m in out if m["model_type"] == model_type]
    if vintage:
        out = [m for m in out if m["vintage"] == vintage]
    if segment:
        out = [m for m in out if m.get("segment") == segment]
    return out


def get_metric_detail(model_id: str, vintage: str, segment: Optional[str] = None) -> Optional[dict]:
    """Get full metrics for a single model, vintage, and optional segment (for detail view)."""
    for m in metrics_store:
        if m["model_id"] != model_id or m["vintage"] != vintage:
            continue
        if segment is None or m.get("segment") == segment:
            return m
    return None


def add_dataset(dataset_id: str, metadata: dict, qc_status: str, scored_data: Optional[dict] = None):
    """Store a dataset after ingestion and optional QC/scoring."""
    datasets_store[dataset_id] = {
        "metadata": metadata,
        "qc_status": qc_status,
        "scored_data": scored_data,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }


def save_metrics(record: dict):
    """Append a computed metrics record."""
    metrics_store.append(record)


def get_filter_options() -> dict:
    """Return options for frontend filters."""
    return {
        "portfolios": list(PORTFOLIOS),
        "model_types": list(MODEL_TYPES),
        "vintages": list(VINTAGES),
        "segments": [{"value": "thin_file", "label": "Thin file"}, {"value": "thick_file", "label": "Thick file"}],
    }


def get_metrics_trends(model_id: str, segment: Optional[str] = None) -> dict | None:
    """
    Get KS, PSI, volume, and bad_rate trend data for a model across vintages.
    For ACQ with segment, filter to that segment; else one row per vintage (first segment).
    """
    rows = [r for r in metrics_store if r["model_id"] == model_id]
    if segment:
        rows = [r for r in rows if r.get("segment") == segment]
    if not rows:
        return None
    # One row per vintage (for ACQ we may have thin+thick per vintage)
    by_vintage = {}
    for r in sorted(rows, key=lambda x: (x["vintage"], x.get("segment") or "")):
        by_vintage[r["vintage"]] = r
    rows = [by_vintage[v] for v in sorted(by_vintage)]
    m = rows[0]
    vintages = [r["vintage"] for r in rows]
    ks = [r.get("metrics", {}).get("KS") for r in rows]
    psi = [r.get("metrics", {}).get("PSI") for r in rows]
    volume = [r.get("volume", 0) for r in rows]
    bad_rate = [r.get("metrics", {}).get("bad_rate") for r in rows]
    return {
        "model_id": model_id,
        "model_type": m.get("model_type", ""),
        "portfolio": m.get("portfolio", ""),
        "vintages": vintages,
        "ks": [float(x) if x is not None else None for x in ks],
        "psi": [float(x) if x is not None else None for x in psi],
        "volume": [int(x) for x in volume],
        "bad_rate": [float(x) if x is not None else None for x in bad_rate],
    }


# Segment names for Acquisition Scorecard (thin file = limited credit history, thick file = established)
ACQ_SEGMENTS = ["thin_file", "thick_file"]


def get_segment_metrics(model_id: str, vintage: str) -> dict | None:
    """
    Segment-level metrics for Acquisition Scorecard: thin file vs thick file.
    Returns { model_id, vintage, model_type, segments: [ { segment, label, metrics, volume } ] } or None.
    """
    detail = get_metric_detail(model_id, vintage)
    if not detail or detail.get("model_type") != "Acquisition Scorecard":
        return None
    import random
    random.seed(hash((model_id, vintage)) % (2**32))
    segments_out = []
    labels = {"thin_file": "Thin file", "thick_file": "Thick file"}
    for seg in ACQ_SEGMENTS:
        metrics = {
            "KS": round(0.2 + random.random() * 0.28, 4),
            "PSI": round(0.05 + random.random() * 0.12, 4),
            "AUC": round(0.65 + random.random() * 0.28, 4),
            "Gini": round(0.3 + random.random() * 0.5, 4),
            "bad_rate": round(0.05 + random.random() * 0.18, 4),
        }
        volume = int(2000 + random.random() * 15000)
        segments_out.append({
            "segment": seg,
            "label": labels.get(seg, seg),
            "metrics": metrics,
            "volume": volume,
        })
    return {
        "model_id": model_id,
        "vintage": vintage,
        "model_type": "Acquisition Scorecard",
        "segments": segments_out,
    }


def get_decile_metrics(model_id: str, vintage: str, segment: Optional[str] = None) -> list[dict]:
    """
    Decile-level metrics for a model/vintage (score decile 1 = highest risk, 10 = lowest).
    Returns list of { decile, count, bad_count, bad_rate }.
    Prototype: deterministic mock from model_id/vintage.
    """
    import random
    random.seed(hash((model_id, vintage, segment or "")) % (2**32))
    out = []
    total = 5000 + int(random.random() * 15000)
    # Decile 1 has highest bad rate, decile 10 lowest (monotonic)
    base_bad_rate = 0.05 + random.random() * 0.15
    for d in range(1, 11):
        count = total // 10 + (int(random.random() * 200) - 100)
        count = max(100, count)
        # Bad rate decreases from decile 1 to 10
        bad_rate = base_bad_rate * (1.8 - 0.08 * d) + random.random() * 0.03
        bad_rate = max(0.01, min(0.5, bad_rate))
        bad_count = int(count * bad_rate)
        out.append({
            "decile": d,
            "count": count,
            "bad_count": bad_count,
            "bad_rate": round(bad_rate, 4),
        })
    return out


def get_variable_stability(model_id: str, vintage: str) -> list[dict]:
    """
    Variable-level stability (e.g. PSI per variable). Prototype: mock data.
    Returns list of { variable, psi, status } where status is green|amber|red.
    """
    import random
    random.seed(hash((model_id, vintage)) % (2**32))
    vars_and_psi = [
        ("Age", 0.03 + random.random() * 0.12),
        ("Income", 0.02 + random.random() * 0.15),
        ("Tenure", 0.04 + random.random() * 0.18),
        ("Utilization", 0.05 + random.random() * 0.2),
        ("DPD_30", 0.02 + random.random() * 0.1),
    ]
    out = []
    for var, psi in vars_and_psi:
        if psi < 0.1:
            status = "green"
        elif psi < 0.2:
            status = "amber"
        else:
            status = "red"
        out.append({"variable": var, "psi": round(psi, 4), "status": status})
    return out


# Initialize seed data on import
_seed_models()
_seed_metrics()
