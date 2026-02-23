"""
Data ingestion: accept payload and store with metadata (portfolio, model_type, vintage).
"""

import uuid
from datetime import datetime


def ingest(payload: dict, portfolio: str, model_type: str, model_id: str, vintage: str) -> dict:
    """
    Ingest a dataset. Payload can be list of records or base64 file content in production.
    Returns dataset_id and status.
    """
    dataset_id = str(uuid.uuid4())[:8]
    metadata = {
        "portfolio": portfolio,
        "model_type": model_type,
        "model_id": model_id,
        "vintage": vintage,
        "ingestion_time": datetime.utcnow().isoformat() + "Z",
        "row_count": len(payload) if isinstance(payload, list) else 0,
    }
    from store import add_dataset
    add_dataset(dataset_id, metadata, qc_status="pending", scored_data=payload)
    return {"dataset_id": dataset_id, "status": "ingested", "metadata": metadata}
