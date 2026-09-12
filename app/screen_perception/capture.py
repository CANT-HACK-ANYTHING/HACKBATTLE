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
    """Publish a ScreenEvent once per second on ZeroMQ.
    Topic: 'screen.events'
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
