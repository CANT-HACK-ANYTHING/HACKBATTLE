import grpc
from common.proto import actuator_pb2_grpc as act_grpc, actuator_pb2 as act_pb

def main():
    channel = grpc.insecure_channel('localhost:50051')
    stub = act_grpc.ActuatorStub(channel)
    request = act_pb.ActuateRequest(
        type=act_pb.ActuationType.CLICK,
        x=100,
        y=200,
        text=""
    )
    try:
        response = stub.Execute(request)
        print('Response:', response)
    except grpc.RpcError as e:
        print('RPC error:', e)

if __name__ == "__main__":
    main()
