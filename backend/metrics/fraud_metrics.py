"""
Transaction Fraud model metrics: AUC, AUC-PR, KS, PSI, CA, Precision/Recall @ K, FPR, alert rate.
"""

import numpy as np
from ks_logistic_model import calculate_ks
from .psi import calculate_psi
from .auc_ca import calculate_auc, calculate_ca_at_k


def precision_at_k(y_true: np.ndarray, y_pred_proba: np.ndarray, k_percent: float) -> float:
    """Precision when taking top k% of population by score."""
    y_true = np.asarray(y_true).flatten()
    y_pred_proba = np.asarray(y_pred_proba).flatten()
    n = len(y_true)
    n_top = max(1, int(n * (k_percent / 100)))
    order = np.argsort(y_pred_proba)[::-1]
    top_indices = order[:n_top]
    tp = np.sum(y_true[top_indices] == 1)
    return float(tp / n_top)


def recall_at_k(y_true: np.ndarray, y_pred_proba: np.ndarray, k_percent: float) -> float:
    """Recall when taking top k% of population by score."""
    y_true = np.asarray(y_true).flatten()
    n_pos = np.sum(y_true == 1)
    if n_pos == 0:
        return 0.0
    ca = calculate_ca_at_k(y_true, y_pred_proba, k_percent)  # recall at top k% = CA at k%
    return float(ca)


def compute_fraud_metrics(
    y_true: np.ndarray,
    y_pred_proba: np.ndarray,
    threshold: float = 0.5,
    y_baseline_proba: np.ndarray | None = None,
) -> dict:
    """Compute fraud-specific metrics."""
    y_true = np.asarray(y_true).flatten()
    y_pred_proba = np.asarray(y_pred_proba).flatten()
    ks, _, _, _, _ = calculate_ks(y_true, y_pred_proba)
    auc = calculate_auc(y_true, y_pred_proba)
    ca10 = calculate_ca_at_k(y_true, y_pred_proba, 10.0)
    prec5 = precision_at_k(y_true, y_pred_proba, 5.0)
    pred_pos = y_pred_proba >= threshold
    n_pred_pos = np.sum(pred_pos)
    n_total = len(y_true)
    alert_rate = float(n_pred_pos / n_total) if n_total else 0.0
    tn = np.sum((y_true == 0) & (~pred_pos))
    n_neg = np.sum(y_true == 0)
    fpr = float(1 - tn / n_neg) if n_neg else 0.0
    fraud_in_alerts = np.sum(y_true[pred_pos] == 1) / n_pred_pos if n_pred_pos else 0.0
    # AUC-PR approximation (simplified)
    from sklearn.metrics import average_precision_score
    try:
        auc_pr = float(average_precision_score(y_true, y_pred_proba))
    except Exception:
        auc_pr = 0.0
    psi = 0.0
    if y_baseline_proba is not None and len(y_baseline_proba) > 0:
        psi = calculate_psi(np.asarray(y_baseline_proba).flatten(), y_pred_proba)
    return {
        "KS": round(float(ks), 4),
        "PSI": round(float(psi), 4),
        "AUC": round(float(auc), 4),
        "AUC_PR": round(auc_pr, 4),
        "CA_at_10": round(float(ca10), 4),
        "precision_at_5": round(float(prec5), 4),
        "alert_rate": round(float(alert_rate), 4),
        "fpr_at_threshold": round(float(fpr), 4),
        "fraud_rate_in_alerts": round(float(fraud_in_alerts), 4),
    }
