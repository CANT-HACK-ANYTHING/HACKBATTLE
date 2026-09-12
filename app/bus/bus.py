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
