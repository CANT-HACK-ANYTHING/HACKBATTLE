"""
Memory client – talks to BE‑2’s drift‑detector over HTTP.
"""

import hashlib
import requests
from typing import Tuple, Optional

# Endpoint of BE‑2 drift‑detector (adjust if needed)
MEMORY_URL = "http://172.18.238.74:8000/api/memory/drift-check"
# Short timeout – we don’t want to block the UI
TIMEOUT_SEC = 2.0


def _hash_image(png_bytes: bytes) -> str:
    """Return a SHA‑256 hex digest of the supplied PNG bytes.
    The hash uniquely identifies the visual appearance of the UI element.
    """
    return hashlib.sha256(png_bytes).hexdigest()


def check_drift(
    task_id: str,
    step_index: int,
    visual_hash: str,
    bbox: dict,
    target_element: str,
) -> Tuple[str, Optional[dict]]:
    """POST to BE‑2 and return a classification and optional healed bbox.

    Args:
        task_id: Identifier of the high‑level task (e.g., "vendor_payout_task").
        step_index: Index of the step inside the task.
        visual_hash: SHA‑256 hash of the observed element image.
        bbox: Bounding box of the observed element – dict with keys x, y, w, h.
        target_element: Logical name of the UI element (e.g., "btn_submit").

    Returns:
        (classification, healed_bbox)
        - classification is "MATCH" or "DRIFT".
        - healed_bbox is a dict with x, y, w, h when classification == "DRIFT",
          otherwise ``None``.
    """
    payload = {
        "task_id": task_id,
        "step_index": step_index,
        "observed_visual_hash": visual_hash,
        "observed_bbox": bbox,
        "target_element": target_element,
    }
    try:
        response = requests.post(MEMORY_URL, json=payload, timeout=TIMEOUT_SEC)
        response.raise_for_status()
        data = response.json()
        classification = data.get("classification", "MATCH")
        healed = data.get("healed_bbox") if classification == "DRIFT" else None
        return classification, healed
    except Exception:
        # Network error or malformed response – fall back to MATCH (no drift)
        return "MATCH", None
