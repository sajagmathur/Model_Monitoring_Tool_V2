"""
Intelligent commentary for Volume trend, KS trend, and decile-level data.
Rule-based insights; can be extended with LLM later.
"""

from typing import Any


def _pct_change(first: float, last: float) -> float | None:
    if first is None or last is None or first == 0:
        return None
    return round((last - first) / first * 100, 1)


def _trend_direction(values: list[float | None], higher_is_better: bool = True) -> str:
    """Return 'up', 'down', or 'stable' based on first vs last and optional slope."""
    clean = [v for v in values if v is not None]
    if len(clean) < 2:
        return "stable"
    first, last = clean[0], clean[-1]
    if first == 0:
        return "stable"
    pct = (last - first) / first * 100
    if abs(pct) < 5:
        return "stable"
    if higher_is_better:
        return "up" if pct > 0 else "down"
    return "down" if pct > 0 else "up"


def generate_trend_commentary(trend_data: dict[str, Any]) -> dict[str, str]:
    """
    Generate commentary for KS trend, Volume trend, PSI trend, and bad rate trend.
    trend_data: { vintages, ks, psi, volume, bad_rate } (lists).
    Returns { volume_commentary, ks_commentary, psi_commentary, bad_rate_commentary }.
    """
    vintages = trend_data.get("vintages") or []
    ks_list = trend_data.get("ks") or []
    psi_list = trend_data.get("psi") or []
    volume_list = trend_data.get("volume") or []
    bad_rate_list = trend_data.get("bad_rate") or []

    def _comment(
        label: str,
        values: list,
        higher_is_better: bool,
        unit: str = "",
        format_pct: bool = False,
    ) -> str:
        if len(values) < 2:
            return f"Not enough vintages to comment on {label} trend."
        first, last = values[0], values[-1]
        direction = _trend_direction(values, higher_is_better)
        pct = _pct_change(first, last) if first is not None and last is not None else None
        if format_pct and pct is not None and unit == "":
            unit = "%"
        pct_str = f" ({pct:+.1f}{unit})" if pct is not None else ""
        if direction == "stable":
            return f"{label} trend: stable across vintages{pct_str}."
        if higher_is_better:
            return f"{label} trend: {'improving' if direction == 'up' else 'declining'}{pct_str}."
        return f"{label} trend: {'improving (lower is better)' if direction == 'down' else 'worsening (higher than desired)'}{pct_str}."

    volume_commentary = _comment(
        "Volume",
        volume_list,
        higher_is_better=False,  # we just describe up/down
        unit="%",
    )
    # For volume, "up" means more volume; we describe neutrally
    if volume_list and len(volume_list) >= 2:
        first_v, last_v = volume_list[0], volume_list[-1]
        pct = _pct_change(first_v, last_v) if first_v else None
        if pct is not None:
            if abs(pct) < 5:
                volume_commentary = f"Volume trend: stable across vintages (latest {last_v:,})."
            else:
                volume_commentary = f"Volume trend: {'increased' if pct > 0 else 'decreased'} by {abs(pct):.1f}% from first to latest vintage (latest: {last_v:,})."

    ks_commentary = _comment("KS", ks_list, higher_is_better=True, unit="")
    psi_commentary = _comment("PSI", psi_list, higher_is_better=False, unit="")
    bad_rate_commentary = _comment("Bad rate", bad_rate_list, higher_is_better=False, unit="%", format_pct=True)

    return {
        "volume_commentary": volume_commentary,
        "ks_commentary": ks_commentary,
        "psi_commentary": psi_commentary,
        "bad_rate_commentary": bad_rate_commentary,
    }


def generate_decile_commentary(deciles: list[dict[str, Any]]) -> str:
    """
    Generate commentary on decile-level data.
    deciles: list of { decile, count, bad_count, bad_rate } (decile 1 = riskiest).
    """
    if not deciles:
        return "No decile data available for this model/vintage."
    bad_rates = [d.get("bad_rate") for d in deciles if d.get("bad_rate") is not None]
    if not bad_rates:
        return "Decile table available; bad rate by decile not computed."
    # Check monotonicity (decile 1 should have highest bad rate typically)
    d1_rate = bad_rates[0] if bad_rates else None
    d10_rate = bad_rates[-1] if bad_rates else None
    if d1_rate is not None and d10_rate is not None:
        separation = (d1_rate - d10_rate) * 100  # percentage points
        if separation > 5:
            return (
                f"Decile 1 (highest risk) shows the highest bad rate ({d1_rate * 100:.1f}%); "
                f"decile 10 the lowest ({d10_rate * 100:.1f}%). Good separation across score deciles."
            )
        if separation > 0:
            return (
                f"Decile 1 bad rate: {d1_rate * 100:.1f}%; decile 10: {d10_rate * 100:.1f}%. "
                "Moderate separation; review if expected monotonic pattern is stronger."
            )
    return "Decile-level bad rates are available; review the table for risk gradient across score bands."


def generate_ks_trigger_insight(ks_value: float | None, deciles: list[dict[str, Any]]) -> str:
    """
    Explain why KS may have triggered (e.g. below 0.3) using decile-level context.
    Decile 1 = highest risk; weak separation in top deciles often drives low KS.
    """
    if ks_value is None:
        return "KS not available for this model/vintage."
    if not deciles:
        return f"KS = {ks_value:.3f}. Load decile data to understand which score bands drive this value."
    # Green: KS >= 0.3 and PSI < 0.2; Amber: KS 0.2-0.3; Red: KS < 0.2
    if ks_value >= 0.3:
        return f"KS = {ks_value:.3f} (above 0.3 threshold). Model discrimination is healthy; decile table confirms separation."
    bad_rates = [d.get("bad_rate") for d in deciles if d.get("bad_rate") is not None]
    if not bad_rates:
        return f"KS = {ks_value:.3f} (below 0.3). Review decile table for separation pattern."
    d1 = bad_rates[0] * 100
    d10 = bad_rates[-1] * 100
    gap = d1 - d10
    if ks_value < 0.2:
        return (
            f"KS = {ks_value:.3f} (red trigger: below 0.2). "
            f"Decile 1 bad rate ({d1:.1f}%) vs decile 10 ({d10:.1f}%) shows {gap:.1f}pp separation. "
            "Weak discrimination in the riskiest deciles may be driving the trigger; review score distribution and recent population shift."
        )
    return (
        f"KS = {ks_value:.3f} (amber: between 0.2 and 0.3). "
        f"Decile 1 bad rate {d1:.1f}%, decile 10 {d10:.1f}%. "
        "Improving separation in top deciles (e.g. deciles 1–3) could help lift KS above 0.3."
    )
