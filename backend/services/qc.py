"""
Data QC: completeness, schema, basic validity. Returns pass/fail and report.
"""


def run_qc(data: list[dict], required_columns: list[str] | None = None) -> dict:
    """
    Run QC on a list of records. required_columns: if provided, check presence.
    """
    if not data:
        return {"pass": False, "reason": "empty_data", "details": "No records"}
    required_columns = required_columns or []
    cols = list(data[0].keys()) if data else []
    missing = [c for c in required_columns if c not in cols]
    if missing:
        return {"pass": False, "reason": "schema", "details": f"Missing columns: {missing}"}
    return {
        "pass": True,
        "reason": "ok",
        "details": f"Rows: {len(data)}, Columns: {len(cols)}",
        "row_count": len(data),
    }
