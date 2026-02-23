"""
Scorecard / Acquisition / ECM / Bureau metrics: KS, PSI, AUC, CA.
Uses project root ks_logistic_model for KS.
"""

import sys
from pathlib import Path

# Allow importing from project root
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import numpy as np
from ks_logistic_model import calculate_ks

from .psi import calculate_psi
from .auc_ca import calculate_auc, calculate_ca_at_k


def compute_scorecard_metrics(
    y_true: np.ndarray,
    y_pred_proba: np.ndarray,
    y_baseline_proba: np.ndarray | None = None,
) -> dict:
    """
    Compute KS, PSI, AUC, CA@10, Gini for scorecard-type models.
    If y_baseline_proba is provided, PSI is computed; else PSI is omitted or set to 0.
    """
    y_true = np.asarray(y_true).flatten()
    y_pred_proba = np.asarray(y_pred_proba).flatten()
    ks, ks_threshold, _, _, _ = calculate_ks(y_true, y_pred_proba)
    auc = calculate_auc(y_true, y_pred_proba)
    ca10 = calculate_ca_at_k(y_true, y_pred_proba, 10.0)
    gini = 2 * auc - 1  # Gini = 2*AUC - 1 for binary
    psi = 0.0
    if y_baseline_proba is not None and len(y_baseline_proba) > 0:
        psi = calculate_psi(np.asarray(y_baseline_proba).flatten(), y_pred_proba)
    return {
        "KS": round(float(ks), 4),
        "PSI": round(float(psi), 4),
        "AUC": round(float(auc), 4),
        "CA_at_10": round(float(ca10), 4),
        "Gini": round(float(gini), 4),
        "KS_threshold": round(float(ks_threshold), 4),
    }
