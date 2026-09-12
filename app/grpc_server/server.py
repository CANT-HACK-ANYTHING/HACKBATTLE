import os, hmac, structlog
import grpc
from concurrent import futures
from common.proto import actuator_pb2_grpc as act_grpc
from common.proto import actuator_pb2 as act_pb
from app.os_actuator.actuator import click, drag, type_keys
from pynput.mouse import Controller as MouseCtrl

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
        if request.type == act_pb.ActuationType.CLICK:
            click(request.x, request.y)
        elif request.type == act_pb.ActuationType.DRAG:
            start = MouseCtrl().position
            if start is None:
                start = (request.x, request.y)
            drag(start, (request.x, request.y))
        elif request.type == act_pb.ActuationType.TYPE:
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
