# BE‑1 – Hands Engine Implementation

Below is a **complete set of Python modules** that you can place under `C:\hackbattle`.  The directory structure mirrors the package layout we created earlier.

---

## 1️⃣ `app\memory_client\client.py`
```python
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
```
---

## 2️⃣ `app\screen_perception\capture.py`
```python
import time
import dxcam
import cv2
import structlog
import zmq
from common.proto import event_pb2 as ev

log = structlog.get_logger(__name__)

def _enumerate_ui():
    """Return a list of UIElement protobuf messages using pywinauto."""
    from pywinauto import Desktop
    elements = []
    for w in Desktop(backend="uia").windows():
        rect = w.rectangle()
        elem = ev.UIElement(
            id=int(w.handle),
            name=w.window_text(),
            role=w.friendly_class_name(),
            x=rect.left,
            y=rect.top,
            w=rect.width(),
            h=rect.height(),
        )
        elements.append(elem)
    return elements

def start_publisher():
    """Publish a `ScreenEvent` once per second on ZeroMQ.
    Topic: ``screen.events``
    """
    ctx = zmq.Context()
    pub = ctx.socket(zmq.PUB)
    pub.bind("tcp://127.0.0.1:5555")  # screen.events
    cam = dxcam.create()
    cam.start(target_fps=30)

    log.info("Screen publisher started")
    try:
        while True:
            frame = cam.get_latest_frame()
            # Encode frame as PNG bytes
            success, buf = cv2.imencode('.png', frame)
            png_bytes = buf.tobytes()
            screen_msg = ev.ScreenEvent(
                ts=int(time.time() * 1e6),
                png=png_bytes,
                elements=_enumerate_ui(),
            )
            pub.send_multipart([b"screen.events", screen_msg.SerializeToString()])
            time.sleep(1.0)  # 1 Hz – adjust as needed
    finally:
        cam.stop()
        pub.close()
        ctx.term()
```
---

## 3️⃣ `app\vision\hand.py`
```python
"""Vision stub – returns a fixed hand point.
Replace this with a MediaPipe implementation when you are ready.
"""

def get_hand_point():
    """Return (x, y, confidence) for the hand.
    For a 1920x1080 screen we use the centre point.
    """
    return 960, 540, 0.99
```
---

## 4️⃣ `app\calibration\calib.py`
```python
import numpy as np
import cv2

def compute_homography(src_pts, dst_pts):
    """Compute a 3×3 homography matrix.
    Args:
        src_pts: list of (x, y) in camera coordinates.
        dst_pts: list of (x, y) in screen coordinates.
    Returns:
        NumPy array of shape (3, 3).
    """
    src = np.array(src_pts, dtype=np.float32)
    dst = np.array(dst_pts, dtype=np.float32)
    H, _ = cv2.findHomography(src, dst, method=0)
    return H
```
---

## 5️⃣ `app\mapper\map.py`
```python
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

    # Compute visual hash of the element's PNG fragment (quick stub using the full PNG)
    visual_hash = _hash_image(b"placeholder")  # replace with actual crop if needed
    bbox = {"x": matched.x, "y": matched.y, "w": matched.w, "h": matched.h}
    classification, healed = check_drift(
        task_id=task_id,
        step_index=step_index,
        visual_hash=visual_hash,
        bbox=bbox,
        target_element=target_name,
    )
    return matched, classification, healed
```
---

## 6️⃣ `app\os_actuator\actuator.py`
```python
import structlog
from pynput.mouse import Controller as MouseCtrl, Button
from pynput.keyboard import Controller as KeyboardCtrl
import win32gui

log = structlog.get_logger(__name__)
mouse = MouseCtrl()
keyboard = KeyboardCtrl()

def glide_to(x, y, duration=0.2):
    """Smooth glide to (x, y) using linear interpolation.
    ``duration`` is total time in seconds.
    """
    start_x, start_y = mouse.position
    steps = int(duration * 60)  # 60 updates per second
    for i in range(1, steps + 1):
        interp_x = int(start_x + (x - start_x) * i / steps)
        interp_y = int(start_y + (y - start_y) * i / steps)
        mouse.position = (interp_x, interp_y)
    log.info("glided mouse", start=(start_x, start_y), end=(x, y))

def click(x, y):
    glide_to(x, y)
    mouse.click(Button.left, 1)
    log.info("mouse click", x=x, y=y)

def drag(start, end):
    glide_to(*start)
    mouse.press(Button.left)
    glide_to(*end)
    mouse.release(Button.left)
    log.info("mouse drag", start=start, end=end)

def type_keys(text):
    for ch in text:
        keyboard.press(ch)
        keyboard.release(ch)
    log.info("typed keys", text=text)

def focus_window(handle):
    win32gui.SetForegroundWindow(handle)
    log.info("focused window", handle=handle)
```
---

## 7️⃣ `app\grpc_server\server.py`
```python
import os, hmac, structlog
import grpc
from concurrent import futures
from common.proto import actuator_pb2_grpc as act_grpc
from common.proto import actuator_pb2 as act_pb
from app.os_actuator.actuator import click, drag, type_keys

log = structlog.get_logger(__name__)
TOKEN_PATH = os.path.abspath(r"C:\Users\adars_6dx4mbx\.gemini\antigravity\scratch\token.bin")

def _load_token():
    try:
        with open(TOKEN_PATH, "rb") as f:
            return f.read().strip()
    except FileNotFoundError:
        return b""

TOKEN = _load_token()

class ActuatorServicer(act_grpc.ActuatorServicer):
    def Execute(self, request, context):
        md = dict(context.invocation_metadata())
        client_token = md.get("auth-token", "").encode()
        if TOKEN and not hmac.compare_digest(client_token, TOKEN):
            context.abort(grpc.StatusCode.UNAUTHENTICATED, "Bad token")
        # Dispatch based on request type
        if request.type == act_pb.ActuateRequest.CLICK:
            click(request.x, request.y)
        elif request.type == act_pb.ActuateRequest.DRAG:
            # For demo we treat (x,y) as the end point, start is current cursor
            start = mouse.position  # mouse imported inside actuator module
            drag(start, (request.x, request.y))
        elif request.type == act_pb.ActuateRequest.TYPE:
            type_keys(request.text)
        else:
            log.warning("unknown actuation type", typ=request.type)
        return act_pb.ActuateResponse(ok=True, message="executed")

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
    act_grpc.add_ActuatorServicer_to_server(ActuatorServicer(), server)
    server.add_insecure_port("[::]:50051")
    server.start()
    log.info("gRPC Actuator server listening on 50051")
    server.wait_for_termination()

if __name__ == "__main__":
    serve()
```
---

## 8️⃣ `app\bus\bus.py`
```python
import zmq
import structlog
log = structlog.get_logger(__name__)

class Bus:
    def __init__(self, ctx=None):
        self.ctx = ctx or zmq.Context()
        self.pub = self.ctx.socket(zmq.PUB)
        self.sub = self.ctx.socket(zmq.SUB)

    # ---------- publishing ----------
    def bind_pub(self, address: str):
        self.pub.bind(address)

    def publish(self, topic: str, protobuf_msg):
        self.pub.send_multipart([topic.encode(), protobuf_msg.SerializeToString()])

    # ---------- subscribing ----------
    def connect_sub(self, address: str, topics):
        self.sub.connect(address)
        for t in topics:
            self.sub.setsockopt(zmq.SUBSCRIBE, t.encode())

    def recv(self):
        topic, payload = self.sub.recv_multipart()
        return topic.decode(), payload
```
---

## 9️⃣ `run_pipeline.py`
```python
import threading, time, structlog
from app.vision.hand import get_hand_point
from app.mapper.map import map_point_to_element
from app.bus.bus import Bus
from common.proto import event_pb2 as ev

log = structlog.get_logger(__name__)

TASK_ID = "vendor_payout_task"
STEP_INDEX = 5
TARGET_ELEMENT_NAME = "btn_submit"

def intent_worker():
    bus = Bus()
    # Subscribe to the screen events published by capture.py
    bus.connect_sub("tcp://127.0.0.1:5555", ["screen.events"])
    while True:
        topic, payload = bus.recv()
        if topic != "screen.events":
            continue
        screen_evt = ev.ScreenEvent()
        screen_evt.ParseFromString(payload)

        # Get a hand point (static stub for now)
        x, y, conf = get_hand_point()
        element, classification, healed_bbox = map_point_to_element(
            (x, y), screen_evt.elements, TASK_ID, STEP_INDEX, TARGET_ELEMENT_NAME
        )
        if not element:
            log.info("no UI element under hand point")
            continue

        # Choose which bbox to use based on classification
        if classification == "DRIFT" and healed_bbox:
            bbox = healed_bbox
            log.info("DRIFT detected – using healed coordinates", healed=bbox)
        else:
            bbox = {"x": element.x, "y": element.y, "w": element.w, "h": element.h}
            log.info("MATCH – using observed coordinates", bbox=bbox)

        # Glide to the centre of the chosen bbox and click
        centre_x = bbox["x"] + bbox["w"] // 2
        centre_y = bbox["y"] + bbox["h"] // 2
        intent = ev.Intent(
            ts=int(time.time() * 1e6),
            action=ev.Intent.LOOK_CLICK,
            element_id=element.id,
        )
        # Publish intent (optional – other components may listen)
        bus.publish("hands.intent", intent)
        # Directly invoke the actuator via gRPC for the demo
        import grpc
        from common.proto import actuator_pb2_grpc as act_grpc
        from common.proto import actuator_pb2 as act_pb
        channel = grpc.insecure_channel("localhost:50051")
        stub = act_grpc.ActuatorStub(channel)
        req = act_pb.ActuateRequest(type=act_pb.ActuateRequest.CLICK, x=centre_x, y=centre_y)
        resp = stub.Execute(req)
        log.info("actuator response", ok=resp.ok, msg=resp.message)
        time.sleep(0.5)

if __name__ == "__main__":
    # 1️⃣ start the screen publisher in a background thread
    threading.Thread(target=__import__("app.screen_perception.capture").capture.start_publisher,
                    daemon=True).start()
    # 2️⃣ run the intent loop (main thread)
    intent_worker()
```
---

## How to Deploy to `C:\hackbattle`
1. **Copy the files** from the artifact folder to your target directory.  From a command prompt you can run:
   ```bat
   xcopy /E /I "C:\Users\adars_6dx4mbx\.gemini\antigravity\brain\<conversation-id>\app" "C:\hackbattle\app"
   xcopy "C:\Users\adars_6dx4mbx\.gemini\antigravity\brain\<conversation-id>\run_pipeline.py" "C:\hackbattle\"
   ```
   Replace `<conversation-id>` with the actual ID shown in the path.
2. Open a **PowerShell** or **Command Prompt**, activate the virtual environment you already created under `C:\hackbattle` (or copy the `venv` folder as well):
   ```bat
   cd C:\hackbattle
   call venv\Scripts\activate.bat
   ```
3. **Start the gRPC server** (required for the pipeline to call the actuator):
   ```bat
   python -m app.grpc_server.server
   ```
4. In a **separate terminal**, run the pipeline which ties everything together:
   ```bat
   python run_pipeline.py
   ```
   You should see log entries indicating screen publishing, drift‑check calls, and mouse clicks.

---

You now have the full BE‑1 source ready in `C:\hackbattle`. Let me know if you need any adjustments, additional tests, or a walkthrough of running the demo. 🚀
