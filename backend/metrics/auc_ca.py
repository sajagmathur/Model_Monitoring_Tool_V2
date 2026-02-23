"""
AUC and Cumulative Accuracy (CA) / Capture Rate for binary classification.
"""

import numpy as np


def calculate_auc(y_true: np.ndarray, y_pred_proba: np.ndarray) -> float:
    """Compute AUC-ROC using trapezoidal rule (equivalent to sklearn roc_auc_score)."""
    y_true = np.asarray(y_true).flatten()
    y_pred_proba = np.asarray(y_pred_proba).flatten()
    order = np.argsort(y_pred_proba)[::-1]
    y_true_sorted = y_true[order]
    n_pos = np.sum(y_true == 1)
    n_neg = np.sum(y_true == 0)
    if n_pos == 0 or n_neg == 0:
        return 0.5
    tp = np.cumsum(y_true_sorted == 1)
    fp = np.cumsum(y_true_sorted == 0)
    # AUC = sum of (delta_FPR * TPR_at_mid)
    tpr = tp / n_pos
    fpr = fp / n_neg
    auc = np.trapz(tpr, fpr)
    return float(np.clip(auc, 0.0, 1.0))


def calculate_ca_at_k(
    y_true: np.ndarray,
    y_pred_proba: np.ndarray,
    k_percent: float = 10.0,
) -> float:
    """
    Cumulative Accuracy / Capture rate: at top k% of population (by score),
    what fraction of all positives (events) are captured?
    """
    y_true = np.asarray(y_true).flatten()
    y_pred_proba = np.asarray(y_pred_proba).flatten()
    n = len(y_true)
    n_pos = np.sum(y_true == 1)
    if n_pos == 0:
        return 0.0
    n_top = max(1, int(n * (k_percent / 100)))
    order = np.argsort(y_pred_proba)[::-1]
    top_indices = order[:n_top]
    captured = np.sum(y_true[top_indices] == 1)
    return float(captured / n_pos)
