import time
import structlog
import zmq
import mss
import mss.tools
from common.proto import event_pb2 as ev
from pywinauto import Desktop

log = structlog.get_logger(__name__)

def _enumerate_ui():
    """Return a list of UIElement protobuf messages using pywinauto."""
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
    log.info("Screen publisher started")
    with mss.mss() as sct:
        monitor = sct.monitors[1]  # primary monitor
        while True:
            sct_img = sct.grab(monitor)
            png_bytes = mss.tools.to_png(sct_img.rgb, sct_img.size)
            screen_msg = ev.ScreenEvent(
                ts=int(time.time() * 1e6),
                png=png_bytes,
                elements=_enumerate_ui(),
            )
            pub.send_multipart([b"screen.events", screen_msg.SerializeToString()])
            time.sleep(1.0)
    # Cleanup (unreachable in infinite loop but kept for completeness)
    # pub.close()
    # ctx.term()
