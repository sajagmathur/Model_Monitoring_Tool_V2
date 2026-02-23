"""
Collections model metrics: roll rate, flow rate, recovery rate, cure rate.
Prototype: compute from arrays of delinquency flags / balances if provided.
"""

import numpy as np


def compute_collections_metrics(
    current_dpd: np.ndarray | None = None,
    prev_dpd: np.ndarray | None = None,
    balance: np.ndarray | None = None,
    recovered: np.ndarray | None = None,
) -> dict:
    """
    Simplified collections metrics. In production these would come from
    cohort/vintage-level roll rates and flow rates.
    """
    if current_dpd is not None and prev_dpd is not None:
        current_dpd = np.asarray(current_dpd).flatten()
        prev_dpd = np.asarray(prev_dpd).flatten()
        n_prev_30 = np.sum(prev_dpd >= 30)
        n_roll = np.sum((prev_dpd >= 30) & (current_dpd >= 60))
        roll_rate_30 = float(n_roll / n_prev_30) if n_prev_30 else 0.0
    else:
        roll_rate_30 = 0.05  # placeholder
    # Placeholder flow/recovery/cure for prototype
    return {
        "roll_rate_30": round(roll_rate_30, 4),
        "flow_rate": round(0.15 + np.random.rand() * 0.1, 4),
        "recovery_rate": round(0.2 + np.random.rand() * 0.15, 4),
        "cure_rate": round(0.25 + np.random.rand() * 0.2, 4),
    }
