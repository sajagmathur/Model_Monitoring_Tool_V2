"""
ML model explainability: feature importance and drift (prototype).
"""

import numpy as np


def get_feature_importance(feature_names: list[str], n: int = 5) -> list[dict]:
    """Placeholder: return mock feature importance for UI."""
    np.random.seed(hash(tuple(feature_names)) % 2**32)
    imp = np.random.dirichlet(np.ones(len(feature_names)))
    imp = imp / imp.sum()
    out = [
        {"feature": name, "importance": round(float(val), 4)}
        for name, val in sorted(zip(feature_names, imp), key=lambda x: -x[1])
    ]
    return out[:n]


def get_importance_drift(
    baseline_importance: list[dict],
    current_importance: list[dict],
) -> float:
    """Rank correlation or simple drift between two importance vectors (placeholder)."""
    return round(0.05 + np.random.rand() * 0.15, 4)
