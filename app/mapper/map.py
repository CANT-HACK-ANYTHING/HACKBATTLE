from common.proto import event_pb2 as ev
from app.memory_client.client import check_drift, _hash_image

def map_point_to_element(point, elements, task_id, step_index, target_name):
    """Map a screen‑space point to a UI element and consult BE‑2.
    Returns a tuple ``(element, classification, healed_bbox)``.
    """
    x, y = point
    matched = None
    for elem in elements:
        if (elem.x <= x < elem.x + elem.w) and (elem.y <= y < elem.y + elem.h):
            matched = elem
            break
    if not matched:
        return None, "MATCH", None

    # Placeholder visual hash – replace with real PNG cropping if needed
    visual_hash = _hash_image(b"placeholder")
    bbox = {"x": matched.x, "y": matched.y, "w": matched.w, "h": matched.h}
    classification, healed = check_drift(
        task_id=task_id,
        step_index=step_index,
        visual_hash=visual_hash,
        bbox=bbox,
        target_element=target_name,
    )
    return matched, classification, healed
