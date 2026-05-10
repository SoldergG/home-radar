#!/usr/bin/env python3
"""
HomeRadar Network Scanner Agent
Lightweight local agent that scans the network and serves device data.
Run on your MacBook — no home server needed.

Usage:
    python agent/scanner.py
    python agent/scanner.py --host 0.0.0.0 --port 7890  # for Tailscale access
"""

import json
import subprocess
import socket
import time
import re
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime
from threading import Thread, Lock

scan_data = {"devices": [], "lastScan": None, "networkInfo": {}}
scan_lock = Lock()


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def get_gateway():
    try:
        result = subprocess.run(
            ["netstat", "-rn"], capture_output=True, text=True, timeout=5
        )
        for line in result.stdout.split("\n"):
            if line.startswith("default"):
                parts = line.split()
                if len(parts) >= 2:
                    return parts[1]
    except Exception:
        pass
    return "192.168.1.1"


def get_subnet():
    local_ip = get_local_ip()
    parts = local_ip.split(".")
    return f"{parts[0]}.{parts[1]}.{parts[2]}.0/24"


def arp_scan():
    devices = []
    try:
        result = subprocess.run(
            ["arp", "-a"], capture_output=True, text=True, timeout=10
        )
        for line in result.stdout.split("\n"):
            match = re.search(
                r"\((\d+\.\d+\.\d+\.\d+)\)\s+at\s+([0-9a-f:]+)", line, re.IGNORECASE
            )
            if match:
                ip = match.group(1)
                mac = match.group(2).upper()
                if mac != "FF:FF:FF:FF:FF:FF" and not mac.startswith("("):
                    hostname = resolve_hostname(ip)
                    devices.append(
                        {
                            "ip": ip,
                            "mac": mac,
                            "hostname": hostname,
                            "vendor": lookup_vendor(mac),
                            "status": "online",
                            "lastSeen": datetime.now().isoformat(),
                        }
                    )
    except Exception as e:
        print(f"[!] ARP scan error: {e}")
    return devices


def resolve_hostname(ip):
    try:
        hostname = socket.gethostbyaddr(ip)[0]
        return hostname
    except Exception:
        return ip


def lookup_vendor(mac):
    oui = mac[:8].replace(":", "").upper()
    vendors = {
        "A4B1C2": "Apple",
        "B5C2D3": "Apple",
        "E8F5A6": "Apple",
        "001A2B": "Router",
        "D7E4F5": "Sony",
        "C6D3E4": "Samsung",
        "F9A6B7": "Google",
        "A0B7C8": "Amazon",
        "B1C8D9": "TP-Link",
        "C2D9E0": "Xiaomi",
        "DC56E7": "Apple",
        "F0DBE2": "Apple",
        "3C22FB": "Apple",
        "00A040": "Apple",
        "ACDE48": "Apple",
        "886B6E": "Apple",
        "9801A7": "Apple",
        "E0B9BA": "Samsung",
        "8C7712": "Samsung",
        "F025B7": "Samsung",
        "B0BE76": "TP-Link",
        "1C3BF3": "TP-Link",
        "64D154": "TP-Link",
    }
    return vendors.get(oui[:6], "Unknown")


def ping_host(ip, timeout=1):
    try:
        result = subprocess.run(
            ["ping", "-c", "1", "-W", str(timeout * 1000), ip],
            capture_output=True,
            text=True,
            timeout=timeout + 1,
        )
        if result.returncode == 0:
            match = re.search(r"time=(\d+\.?\d*)", result.stdout)
            if match:
                return float(match.group(1))
        return None
    except Exception:
        return None


def scan_network():
    global scan_data
    print(f"[*] Scanning network...")
    start = time.time()

    subprocess.run(
        ["ping", "-c", "1", "-W", "1000", get_gateway()],
        capture_output=True,
        timeout=3,
    )

    devices = arp_scan()
    gateway = get_gateway()
    local_ip = get_local_ip()

    gateway_ping = ping_host(gateway)

    network_info = {
        "gatewayIp": gateway,
        "localIp": local_ip,
        "subnet": get_subnet(),
        "ping": gateway_ping,
        "scanDuration": round(time.time() - start, 2),
    }

    with scan_lock:
        scan_data = {
            "devices": devices,
            "lastScan": datetime.now().isoformat(),
            "networkInfo": network_info,
            "deviceCount": len(devices),
        }

    print(
        f"[+] Found {len(devices)} devices in {network_info['scanDuration']}s"
    )
    return scan_data


class ScanHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

        if self.path == "/scan":
            data = scan_network()
            self.wfile.write(json.dumps(data, indent=2).encode())
        elif self.path == "/devices":
            with scan_lock:
                self.wfile.write(json.dumps(scan_data, indent=2).encode())
        elif self.path == "/ping":
            gateway = get_gateway()
            ping = ping_host(gateway)
            result = {
                "gateway": gateway,
                "ping": ping,
                "timestamp": datetime.now().isoformat(),
            }
            self.wfile.write(json.dumps(result, indent=2).encode())
        elif self.path == "/health":
            self.wfile.write(json.dumps({"status": "ok"}).encode())
        else:
            info = {
                "name": "HomeRadar Agent",
                "version": "1.0.0",
                "endpoints": ["/scan", "/devices", "/ping", "/health"],
                "lastScan": scan_data.get("lastScan"),
            }
            self.wfile.write(json.dumps(info, indent=2).encode())

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        print(f"[API] {args[0]}")


def auto_scan(interval):
    while True:
        scan_network()
        time.sleep(interval)


def main():
    parser = argparse.ArgumentParser(description="HomeRadar Network Scanner")
    parser.add_argument("--host", default="127.0.0.1", help="Bind address")
    parser.add_argument("--port", type=int, default=7890, help="Port")
    parser.add_argument(
        "--interval", type=int, default=60, help="Auto-scan interval (seconds)"
    )
    args = parser.parse_args()

    scan_network()

    scanner_thread = Thread(target=auto_scan, args=(args.interval,), daemon=True)
    scanner_thread.start()

    server = HTTPServer((args.host, args.port), ScanHandler)
    print(f"\n{'='*50}")
    print(f"  HomeRadar Agent running")
    print(f"  http://{args.host}:{args.port}")
    print(f"  Auto-scan every {args.interval}s")
    print(f"{'='*50}\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Shutting down...")
        server.shutdown()


if __name__ == "__main__":
    main()
