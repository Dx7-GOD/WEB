#!/usr/bin/env python3
"""
relay_streamer.py
Local auth + payload relay for VapeV4_Streamer_patched.exe.

Changes vs original relay.py:
  - Serves payload_streamer.bin (has Streamer module injected)
  - Adds TCP server on port 8092 for WDA streamer-mode IPC from the Java payload:
      "STREAMER_ON:<pid>"  -> SetWindowDisplayAffinity(mc_hwnd, WDA_EXCLUDEFROMCAPTURE)
      "STREAMER_OFF:<pid>" -> SetWindowDisplayAffinity(mc_hwnd, WDA_NONE)
"""
import ctypes
import json
import os
import struct
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE    = os.path.dirname(os.path.abspath(__file__))
PAYLOAD = os.path.join(HERE, "payload_streamer.bin")
LOG     = os.path.join(HERE, "relay.log")
TOKEN   = "00" * 32

WDA_NONE                 = 0x00000000
WDA_MONITOR              = 0x00000001
WDA_EXCLUDEFROMCAPTURE   = 0x00000011   # Win10 2004+

k32 = ctypes.WinDLL("kernel32", use_last_error=True)
u32 = ctypes.WinDLL("user32",   use_last_error=True)

k32.OpenProcess.restype  = ctypes.c_void_p
k32.OpenProcess.argtypes = [ctypes.c_ulong, ctypes.c_int, ctypes.c_ulong]
u32.SetWindowDisplayAffinity.restype  = ctypes.c_int
u32.SetWindowDisplayAffinity.argtypes = [ctypes.c_void_p, ctypes.c_ulong]
u32.EnumWindows.argtypes = [ctypes.WINFUNCTYPE(ctypes.c_int, ctypes.c_void_p, ctypes.c_long),
                             ctypes.c_long]
u32.GetWindowThreadProcessId.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_ulong)]
u32.IsWindowVisible.restype  = ctypes.c_int
u32.IsWindowVisible.argtypes = [ctypes.c_void_p]


def log(line):
    line = "%s %s" % (time.strftime("%H:%M:%S"), line)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")
    print(line, flush=True)


def find_hwnd_for_pid(pid):
    result = ctypes.c_void_p(0)
    @ctypes.WINFUNCTYPE(ctypes.c_int, ctypes.c_void_p, ctypes.c_long)
    def cb(hwnd, _):
        wpid = ctypes.c_ulong(0)
        u32.GetWindowThreadProcessId(hwnd, ctypes.byref(wpid))
        if wpid.value == pid and u32.IsWindowVisible(hwnd):
            result.value = hwnd
            return 0  # stop
        return 1
    u32.EnumWindows(cb, 0)
    return result.value


def set_streamer_mode(pid, enable):
    hwnd = find_hwnd_for_pid(pid)
    if not hwnd:
        log(f"[WDA] HWND not found for PID {pid}")
        return
    affinity = WDA_EXCLUDEFROMCAPTURE if enable else WDA_NONE
    if not u32.SetWindowDisplayAffinity(hwnd, affinity):
        # Try fallback for older Windows
        if enable:
            u32.SetWindowDisplayAffinity(hwnd, WDA_MONITOR)
            log(f"[WDA] PID {pid} HWND {hwnd:#x} -> WDA_MONITOR (fallback)")
        else:
            log(f"[WDA] Clear failed for PID {pid} HWND {hwnd:#x}")
    else:
        label = "EXCLUDEFROMCAPTURE" if enable else "NONE"
        log(f"[WDA] PID {pid} HWND {hwnd:#x} -> WDA_{label}")


def ipc_server(port):
    """Listen on loopback for STREAMER_ON/OFF commands from the Java payload."""
    import socket
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("127.0.0.1", port))
    srv.listen(8)
    log(f"[IPC] Listening on 127.0.0.1:{port}")
    while True:
        try:
            conn, _ = srv.accept()
            conn.settimeout(2.0)
            data = b""
            try:
                while b"\n" not in data:
                    chunk = conn.recv(256)
                    if not chunk: break
                    data += chunk
            finally:
                conn.close()
            line = data.decode("utf-8", errors="replace").strip()
            log(f"[IPC] recv: {line!r}")
            if line.startswith("STREAMER_ON:"):
                set_streamer_mode(int(line[12:]), True)
            elif line.startswith("STREAMER_OFF:"):
                set_streamer_mode(int(line[13:]), False)
        except Exception as e:
            log(f"[IPC] error: {e}")


# ── HTTP relay (unchanged from original) ──────────────────────────────────────

class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    def log_message(self, *a): pass
    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        return self.rfile.read(n) if n else b""
    def _send(self, code, body, ctype="application/json"):
        if isinstance(body, str): body = body.encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(body)
    def _dispatch(self):
        body = self._body()
        log("%s %s" % (self.command, self.path))
        bare = self.path.split("?")[0].rstrip("/").lower()
        if bare.endswith("/loader/login"):
            self._send(200, json.dumps({"token": TOKEN, "success": True, "edition": "v4",
                                        "expires": int(time.time()) + 315360000})); return
        if bare.endswith("/app-auth/generate"):
            self._send(200, json.dumps({"sessionId": "local", "url": "http://127.0.0.1:8091/app-auth/proceed/local"})); return
        if bare.endswith("/app-auth/status"):
            self._send(200, json.dumps({"status": "success", "token": TOKEN})); return
        if bare.endswith("/client/request-payload"):
            self._send(200, json.dumps({"downloadToken": TOKEN})); return
        if bare.endswith("/client/payload"):
            if not os.path.isfile(PAYLOAD):
                self._send(500, json.dumps({"error": "payload_streamer.bin missing"})); return
            with open(PAYLOAD, "rb") as f: data = f.read()
            log(f"  serving {len(data):,} bytes from {os.path.basename(PAYLOAD)}")
            self._send(200, data, "application/octet-stream"); return
        self._send(404, json.dumps({"error": "no route", "path": self.path}))
    def do_GET(self): self._dispatch()
    def do_POST(self): self._dispatch()
    def do_PUT(self):  self._dispatch()

class Server(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

def main():
    # Start IPC thread
    threading.Thread(target=ipc_server, args=(8092,), daemon=True).start()
    # Start HTTP relay on 8091
    s = Server(("0.0.0.0", 8091), Handler)
    log("relay_streamer ready — HTTP:8091, IPC:8092")
    try:
        s.serve_forever()
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
