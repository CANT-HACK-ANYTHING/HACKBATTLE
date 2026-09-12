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

        # Compute centre of chosen bbox
        centre_x = bbox["x"] + bbox["w"] // 2
        centre_y = bbox["y"] + bbox["h"] // 2

        # Publish intent (optional)
        intent = ev.Intent(
            ts=int(time.time() * 1e6),
            action=ev.Intent.LOOK_CLICK,
            element_id=element.id,
        )
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
    # Start the screen publisher in a background thread
    threading.Thread(target=__import__("app.screen_perception.capture").capture.start_publisher,
                    daemon=True).start()
    # Run the intent worker in the main thread
    intent_worker()
