"""
Population Stability Index (PSI) for score/probability distribution comparison.
"""

import numpy as np


def calculate_psi(
    baseline: np.ndarray,
    current: np.ndarray,
    n_bins: int = 10,
) -> float:
    """
    Compute PSI between baseline and current score/probability distributions.
    PSI > 0.25 often indicates significant shift.
    """
    def _bin_pcts(arr: np.ndarray, edges: np.ndarray) -> np.ndarray:
        pcts = np.zeros(len(edges) - 1)
        for i in range(len(edges) - 1):
            pcts[i] = np.sum((arr >= edges[i]) & (arr < edges[i + 1])) / len(arr)
        pcts = np.clip(pcts, 1e-6, 1.0)  # avoid log(0)
        return pcts

    baseline = np.asarray(baseline).flatten()
    current = np.asarray(current).flatten()
    min_val = min(baseline.min(), current.min())
    max_val = max(baseline.max(), current.max())
    if max_val <= min_val:
        return 0.0
    edges = np.linspace(min_val, max_val, n_bins + 1)
    p_baseline = _bin_pcts(baseline, edges)
    p_current = _bin_pcts(current, edges)
    psi = np.sum((p_current - p_baseline) * (np.log(p_current) - np.log(p_baseline)))
    return float(psi)
