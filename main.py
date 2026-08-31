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
      """  CHECKS FOR LOCALLY CONNECTED DEVICES AND RETURN THEIR IP'S   """
	def local_devices(ip_range: str="172.20.10.0/24" ):
		request=scapy.ARP(pdst=ip_range)
		broadcast = scapy.Ether(dst="ff:ff:ff:ff:ff:ff")
		packet=broadcast/request
		answered_list=scapy.srp(packet,timeout=2, verbose=False)[0]		
		devices=[]
		for sent , recived in answered_list:
			devices.append({"ip":recived.psrc , "mac":recived.hwsrc})
		return devices

"""  LIST OPEN PORTSS IN MY IP  """

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



	def monitor_stealth_scans(
    open_ports: list,
    scan_threshold: int = 5,
    time_window: float = 2.0,
    interface: str = None,
):
    """Monitors live network traffic to detect stealth SYN scans targeting specified open ports.

    
    """
    # Trackers: maps source IP to a dictionary holding its target ports and timestamps
    activity_tracker = defaultdict(
        lambda: {"ports": set(), "first_seen": time.time()}
    )

    print(
        f"   IDS Active: Monitoring open ports {open_ports} for stealth SYN scans..."
    )
    print(f" Press Ctrl+C to stop monitoring.\n")

    def analyze_packet(packet):
        # We only care about IP packets with a TCP layer
        if packet.haslayer(scapy.IP) and packet.haslayer(scapy.TCP):
            src_ip = packet[scapy.IP].src
            dst_port = packet[scapy.TCP].dport
            tcp_flags = packet[scapy.TCP].flags
            current_time = time.time()

            # Check if the packet is hitting one of our defined OPEN ports
            if dst_port in open_ports:
                tracker = activity_tracker[src_ip]

                # Reset tracker window if it expired
                if current_time - tracker["first_seen"] > time_window:
                    tracker["ports"].clear()
                    tracker["first_seen"] = current_time

                # 1. Track incoming SYN packets (The stealth scan attempt)
                if tcp_flags == "S":
                    tracker["ports"].add(dst_port)

                    # If this IP hits multiple open ports quickly without a handshake completion
                    if len(tracker["ports"]) >= scan_threshold:
                        print(
                            f"[!] ALERT: Stealth Port Scan detected from IP: {src_ip}"
                        )
                        print(
                            f"    Targeted open ports rapidly: {list(tracker['ports'])}"
                        )
                        print(
                            "    Behavior: Sending SYN packets and dropping/terminating without final ACK."
                        )
                        # Reset to avoid spamming the console for the same attack wave
                        tracker["ports"].clear()

                # 2. Track normal completion (if they send an ACK or RST, they are engaging normally)
                elif tcp_flags & 0x10 or tcp_flags & 0x04:  # ACK or RST
                    # If they complete or cleanly close, remove the port from the suspicious list
                    if dst_port in tracker["ports"]:
                        tracker["ports"].remove(dst_port)

    try:
        # Sniff live packets. BPF filter targets TCP traffic to reduce overhead.
        scapy.sniff(
            prn=analyze_packet,
            filter="tcp",
            store=0,
            iface=interface,
        )
    except KeyboardInterrupt:
        print("\n[!] Stealth scan monitor stopped by user.")
    except Exception as e:
        print(f"[-] Error in monitor: {e}")




lllst[]=tools.check_port()



































