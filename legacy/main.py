import scapy.all as scapy
import numpy as np
import pandas as pd

"NETWORK SECTION"
class network:
	def __init__(self, ip , name , mac_addr ):
		self.ip=ip
		self.name=name
		self.mac=mac_addr
		 

	def get_info(self):
		return f"name:{self.name} , ip:{self.ip} , mac-address:{self.mac}"

""" ##########      TOOLS SECTION FOR NETWORK MONITORING   ################"""



class tools:
	@staticmethod

#CHECKS FOR LOCALLY CONNECTED DEVICES AND RETURN THEIR IP'S

	def local_devices(ip_range: str="172.20.10.0/24" ):
		request=scapy.ARP(pdst=ip_range)
		broadcast = scapy.Ether(dst="ff:ff:ff:ff:ff:ff")
		packet=broadcast/request
		answered_list=scapy.srp(packet,timeout=2, verbose=False)[0]		
		devices=[]
		for sent , recived in answered_list:
			devices.append({"ip":recived.psrc , "mac":recived.hwsrc})
		return devices

          #LIST OPEN PORTSS IN MY IP"""

	def check_port(target: str="127.0.0.1", ports: list=None):
		if ports is None:
			ports=range(1,2025)
			print(f"Scanning own open ports..")
			open_ports=[]
			for port in ports:
				syn_packet=(scapy.IP(dst=target))/scapy.TCP(sport=scapy.RandShort() , dport=port , flags="S")
				response=scapy.sr1(syn_packet, timeout=0.5,verbose=False)

				if response is not None:
					if response.haslayer(scapy.TCP):
						tcp_flags=response.getlayer(scapy.TCP).flags
						if tcp_flags==0x12 or tcp_flags=="SA":
							open_ports.append(port)
							print(f" Port {port} is open ..")
		print(f"\n Scan complete . Found {len(open_ports)} open ports :{open_ports}")
		return open_ports




        
lst_of_op=tools.check_port()






































