"""Agents -> database"""
"""database -> functions"""
"""functions->model"""
"""model alert ->show alert in dashboard"""
"""model automate -> flag and fix sus devices"""

import scapy
import socket
import json
import time

master='172.20.10.6'
ip='my_ip'
PORT=65432








"this function sends data to master pc using JSON"
def checkLocal():
    usb_conn=True
    sus_command=False



    data={
        "my_ip":ip,
        "usb_conn":bool(usb_conn),
        "sus_command":bool(sus_command),"time":time.time()
    }

    return data



def sendTomaster():
    try:
        with socket.socket(socket.AF_INET,socket.SOCK_STREAM)as client_socket:
            client_socket.connect((master,PORT))
            payload=json.dumps(checkLocal())
            client_socket.sendall(payload.encode('utf-8'))
            print("Data sent succ to mster")
    except ConnectionRefusedError:
        print("Couldnt connect to master , is it even running")


if __name__=="__main__":
    while True:
        sendTomaster()
        time.sleep(5)