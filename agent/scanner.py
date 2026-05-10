#!/usr/bin/env python3
"""
HomeRadar Network Scanner Agent
Suporta: TP-Link Deco (API local), ARP scan, Ping sweep

Instalação:
    pip install requests

Uso:
    python agent/scanner.py                    # localhost:7890
    python agent/scanner.py --host 0.0.0.0    # acesso Tailscale
    python agent/scanner.py --deco-password SENHA_DO_DECO
"""

import json
import subprocess
import socket
import time
import re
import hashlib
import argparse
import base64
import ipaddress
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime
from threading import Thread, Lock
from concurrent.futures import ThreadPoolExecutor

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    print("[!] requests não instalado — sem suporte Deco API (pip install requests)")

# ─────────────────────────────────────────────
state = {"devices": [], "lastScan": None, "networkInfo": {}}
lock  = Lock()
deco_session = {"stok": None, "seq": 1}

# ── Vendor OUI lookup (primeiros 6 hex da MAC) ──────────────────────────────
OUI = {
    # Apple
    "ACDE48": "Apple", "A4B1C2": "Apple", "DC56E7": "Apple", "F0DBE2": "Apple",
    "3C22FB": "Apple", "888605": "Apple", "B4F1DA": "Apple", "10A1DA": "Apple",
    "94BE46": "Apple", "2C9C58": "Apple", "A8BE27": "Apple", "3C0754": "Apple",
    "8866A5": "Apple", "4C57CA": "Apple", "D0817A": "Apple", "78FD94": "Apple",
    "7C6D62": "Apple", "F023B9": "Apple", "DC2B2A": "Apple", "2C6141": "Apple",
    # Samsung
    "E0B9BA": "Samsung", "8C7712": "Samsung", "F025B7": "Samsung",
    "404E36": "Samsung", "B8192D": "Samsung", "3CA10D": "Samsung",
    # TP-Link / Deco
    "3C7895": "TP-Link Deco", "B0BE76": "TP-Link", "1C3BF3": "TP-Link",
    "64D154": "TP-Link", "001D0F": "TP-Link", "50C7BF": "TP-Link",
    "ECF4BB": "TP-Link", "C8D3A3": "TP-Link", "30DE4B": "TP-Link",
    "7440BE": "TP-Link", "80647C": "TP-Link",
    # Google / Nest
    "001A11": "Google", "F4F5E8": "Google", "48D6D5": "Google",
    # Amazon
    "94E2A0": "Amazon", "F081AF": "Amazon", "FC6520": "Amazon",
    # Sony
    "D8476B": "Sony", "D4E85E": "Sony", "10CE9D": "Sony", "001A80": "Sony",
    # Nintendo
    "702F1B": "Nintendo", "98B6E9": "Nintendo", "0009BF": "Nintendo",
    # Microsoft / Xbox
    "28186D": "Microsoft", "7C1E52": "Microsoft",
    # NOS / router
    "000F67": "NOS", "001FC5": "NOS",
}

def vendor_from_mac(mac: str) -> str:
    oui = mac.replace(":", "").upper()[:6]
    return OUI.get(oui, "Desconhecido")

def local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80)); ip = s.getsockname()[0]; s.close()
        return ip
    except Exception:
        return "192.168.68.1"

def gateway() -> str:
    try:
        out = subprocess.check_output(["netstat", "-rn"], text=True, timeout=5)
        for line in out.splitlines():
            if line.startswith("default"):
                parts = line.split()
                if len(parts) >= 2 and re.match(r"\d+\.\d+\.\d+\.\d+", parts[1]):
                    return parts[1]
    except Exception:
        pass
    # Try ip route on Linux
    try:
        out = subprocess.check_output(["ip", "route"], text=True, timeout=5)
        m = re.search(r"default via (\d+\.\d+\.\d+\.\d+)", out)
        if m: return m.group(1)
    except Exception:
        pass
    return "192.168.68.1"

def resolve(ip: str) -> str:
    try:
        return socket.gethostbyaddr(ip)[0]
    except Exception:
        return ip

def ping(ip: str, timeout=0.8) -> float | None:
    try:
        r = subprocess.run(["ping","-c","1","-W",str(int(timeout*1000)),ip],
                           capture_output=True, text=True, timeout=timeout+1)
        if r.returncode == 0:
            m = re.search(r"time=(\d+\.?\d*)", r.stdout)
            if m: return float(m.group(1))
    except Exception:
        pass
    return None

# ── TP-Link Deco API ────────────────────────────────────────────────────────

_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

def deco_login(gw: str, password: str) -> bool:
    if not HAS_REQUESTS or not password:
        return False
    try:
        url = f"https://{gw}/cgi-bin/luci/;stok=/login?form=login"
        pwd_hash = hashlib.md5(password.encode()).hexdigest().upper()
        payload = {"method": "do", "login": {"password": pwd_hash}}
        headers = {
            "User-Agent": _UA,
            "Content-Type": "application/json",
            "Referer": f"https://{gw}/webpages/index.html",
            "Accept": "application/json, text/javascript, */*",
            "X-Requested-With": "XMLHttpRequest",
        }
        r = requests.post(url, json=payload, headers=headers, timeout=6, verify=False)
        data = r.json()
        if data.get("error_code") == 0:
            deco_session["stok"] = data["result"]["stok"]
            print(f"[+] Deco login OK ({gw})")
            return True
        print(f"[!] Deco login falhou (código {r.status_code}): {data}")
    except Exception as e:
        print(f"[!] Deco API indisponível: {e}")
    return False

def deco_get_clients(gw: str) -> list:
    if not HAS_REQUESTS or not deco_session["stok"]:
        return []
    try:
        stok = deco_session["stok"]
        url = f"https://{gw}/cgi-bin/luci/;stok={stok}/admin/client?form=client_list"
        headers = {"User-Agent": _UA, "Referer": f"https://{gw}/webpages/index.html"}
        payload = {"method": "get", "client_list": {}}
        r = requests.post(url, json=payload, headers=headers, timeout=8, verify=False)
        data = r.json()
        clients = []
        for c in data.get("result", {}).get("client_list", []):
            # "name" = Deco-assigned name (shown in the app), "hostname" = mDNS fallback
            deco_name = c.get("name", "") or c.get("custom_name", "") or c.get("hostname", "")
            clients.append({
                "ip":        c.get("ip", ""),
                "mac":       c.get("mac","").upper(),
                "hostname":  deco_name,
                "name":      deco_name,   # used by frontend as display name
                "vendor":    vendor_from_mac(c.get("mac","")),
                "status":    "online" if c.get("online") else "offline",
                "signal":    c.get("rssi", -70),
                "interface": c.get("connection_type",""),
            })
        print(f"[+] Deco API: {len(clients)} clientes")
        return clients
    except Exception as e:
        print(f"[!] Deco client_list erro: {e}")
        deco_session["stok"] = None
        return []

# ── ARP scan fallback ────────────────────────────────────────────────────────

def arp_scan() -> list:
    devices = []
    try:
        out = subprocess.check_output(["arp","-a"], text=True, timeout=10)
        for line in out.splitlines():
            m = re.search(r"\((\d+\.\d+\.\d+\.\d+)\)\s+at\s+([0-9a-fA-F:]+)", line)
            if not m: continue
            ip, mac = m.group(1), m.group(2).upper()
            if "FF:FF:FF:FF:FF:FF" in mac or "(incomplete)" in mac: continue
            devices.append({
                "ip": ip, "mac": mac,
                "hostname": resolve(ip),
                "vendor": vendor_from_mac(mac),
                "status": "online",
            })
    except Exception as e:
        print(f"[!] ARP erro: {e}")
    return devices

def ping_sweep(subnet_prefix: str, threads=40) -> list:
    """Ping sweep to find hosts ARP might miss."""
    found = []
    parts = local_ip().split(".")
    base = f"{parts[0]}.{parts[1]}.{parts[2]}"

    def check(i: int):
        ip = f"{base}.{i}"
        if ping(ip, 0.4) is not None:
            found.append(ip)

    with ThreadPoolExecutor(max_workers=threads) as ex:
        list(ex.map(check, range(1, 255)))
    return found

# ── Main scan ───────────────────────────────────────────────────────────────

def scan(gw: str, deco_pass: str) -> dict:
    print(f"[*] Iniciando scan — {datetime.now().strftime('%H:%M:%S')}")
    t0 = time.time()

    # Try Deco first
    devices = []
    if deco_pass and HAS_REQUESTS:
        if not deco_session["stok"]:
            deco_login(gw, deco_pass)
        devices = deco_get_clients(gw)

    # Fallback / supplement with ARP
    arp = arp_scan()
    for a in arp:
        if not any(d["mac"] == a["mac"] or d["ip"] == a["ip"] for d in devices):
            devices.append(a)

    # Also ping-refresh gateway
    gw_ping = ping(gw)

    # Normalize
    for d in devices:
        if not d.get("hostname") or d["hostname"] == d["ip"]:
            d["hostname"] = resolve(d["ip"])

    net = {
        "gatewayIp": gw,
        "localIp":   local_ip(),
        "ping":      gw_ping,
        "scanDuration": round(time.time() - t0, 2),
    }

    with lock:
        state["devices"] = devices
        state["lastScan"] = datetime.now().isoformat()
        state["networkInfo"] = net

    print(f"[+] {len(devices)} dispositivos em {net['scanDuration']}s  (ping={gw_ping}ms)")
    return dict(state)

# ── HTTP API ─────────────────────────────────────────────────────────────────

class Handler(BaseHTTPRequestHandler):
    gw: str = "192.168.68.1"
    deco_pass: str = ""

    def send_json(self, data):
        body = json.dumps(data, indent=2).encode()
        self.send_response(200)
        self.send_header("Content-Type",  "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == "/scan":
            # Return cached data immediately, trigger background scan
            with lock:
                current = dict(state)
            self.send_json(current)
            Thread(target=scan, args=(Handler.gw, Handler.deco_pass), daemon=True).start()
        elif self.path == "/devices":
            with lock: self.send_json(dict(state))
        elif self.path == "/ping":
            self.send_json({"gateway": Handler.gw, "ping": ping(Handler.gw), "timestamp": datetime.now().isoformat()})
        elif self.path == "/health":
            self.send_json({"status": "ok", "lastScan": state.get("lastScan"), "gateway": Handler.gw, "decoConfigured": bool(Handler.deco_pass)})
        else:
            self.send_json({"name":"HomeRadar Agent","version":"2.1","endpoints":["/scan","/devices","/ping","/health","/config"]})

    def do_POST(self):
        if self.path == "/config":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                cfg = json.loads(body)
                if "deco_password" in cfg and cfg["deco_password"]:
                    Handler.deco_pass = cfg["deco_password"]
                    deco_session["stok"] = None  # force re-login
                    print(f"[*] Deco password atualizada via /config")
                if "gateway" in cfg and cfg["gateway"]:
                    Handler.gw = cfg["gateway"]
                    print(f"[*] Gateway atualizado: {Handler.gw}")
                self.send_json({"ok": True, "decoConfigured": bool(Handler.deco_pass), "gateway": Handler.gw})
            except Exception as e:
                self.send_json({"ok": False, "error": str(e)})
        else:
            self.send_response(404); self.end_headers()

    def log_message(self, fmt, *args):
        print(f"[API] {args[0]}")

def auto_scan(gw, deco_pass, interval):
    while True:
        try: scan(gw, deco_pass)
        except Exception as e: print(f"[!] Auto-scan erro: {e}")
        time.sleep(interval)

# ── Entry point ──────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(description="HomeRadar Scanner")
    p.add_argument("--host",          default="127.0.0.1")
    p.add_argument("--port",          type=int, default=7890)
    p.add_argument("--interval",      type=int, default=60)
    p.add_argument("--gateway",       default=None)
    p.add_argument("--deco-password", default="", dest="deco_pass",
                   help="Password da app TP-Link Deco (para API local)")
    args = p.parse_args()

    gw = args.gateway or gateway()
    print(f"[*] Gateway: {gw}")

    # Initial scan
    scan(gw, args.deco_pass)

    # Background auto-scan
    Thread(target=auto_scan, args=(gw, args.deco_pass, args.interval), daemon=True).start()

    Handler.gw = gw
    Handler.deco_pass = args.deco_pass

    srv = HTTPServer((args.host, args.port), Handler)
    print(f"\n{'─'*50}")
    print(f"  HomeRadar Agent v2.0")
    print(f"  http://{args.host}:{args.port}")
    print(f"  Deco API: {'ACTIVO' if args.deco_pass else 'desactivado (use --deco-password SENHA)'}")
    print(f"  Auto-scan cada {args.interval}s")
    print(f"{'─'*50}\n")

    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] A parar…")

if __name__ == "__main__":
    main()
