"""Agents -> database"""
"""database -> functions"""
"""functions->model"""
"""model alert ->show alert in dashboard"""
"""model automate -> flag and fix sus devices"""


import socket 
import json



HOST='0.0.0.0'
PORT=65432

def runMaster():
    with socket.socket(socket.AF_INET , socket.SOCK_STREAM)as server_socket:
        server_socket.bind((HOST,PORT))
        server_socket.listen()
        print(f" listening on port {PORT}..")

        while True:
            conn, addr=server_socket.accept()
            with conn:
                print(f"Connected by slave {addr}")
                data=conn.recv(1024)
                if not data:
                    break

                    try:
                        payload=json.loads(data.decode('utf-8'))
                        print(f"recieved from {addr} : {payload}")

                    except json.JSONDecodeError:
                        print("faild to parse incoming data")



if __name__=="__main__":
    runMaster()