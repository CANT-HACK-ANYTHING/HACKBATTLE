# Minimal zmq stub for environments without pyzmq

# Constants matching pyzmq's socket types
PUB = 1
SUB = 2

class _DummySocket:
    """A very small in‑process socket stand‑in.
    It supports the subset of methods used by the project's Bus class.
    All operations are no‑ops; messages are discarded.
    """
    def __init__(self, socket_type):
        self.socket_type = socket_type

    def bind(self, address: str):
        pass

    def connect(self, address: str):
        pass

    def setsockopt(self, option, value):
        pass

    def send_multipart(self, parts):
        pass

    def recv_multipart(self):
        return (b"", b"")

class Context:
    """Context compatible with pyzmq's API (subset)."""
    def socket(self, socket_type):
        return _DummySocket(socket_type)

__all__ = ["PUB", "SUB", "Context"]
