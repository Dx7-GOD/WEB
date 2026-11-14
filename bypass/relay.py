#!/usr/bin/env python3
"""
Local auth + payload relay for the Vape V4 controller (VapeV4ControllerRewrite).

The patched launcher talks to this instead of vape.chat:

    POST /loader/login                     -> always {"token": ...}
    POST /api/v1/client/request-payload   -> always {"downloadToken": ...}
    POST /api/v1/client/payload           -> the native payload bytes
    POST /api/v1/app-auth/generate|status -> browser-login path, always succeeds

payload.bin next to this script is the real Vape 4.22 payload
(Vape421Native.dll, 25,160,704 bytes, embedded Java payload md5 b52eb6d8...).
Drop a fresh build there to update it.
"""
import json
import os
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
PAYLOAD = os.path.join(HERE, "payload.bin")
LOG = os.path.join(HERE, "relay.log")

TOKEN = "00" * 32
_logins = 0


def log(line):
    line = "%s %s" % (time.strftime("%H:%M:%S"), line)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")
    print(line, flush=True)


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *a):
        pass

    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        return self.rfile.read(n) if n else b""

    def _send(self, code, body, ctype="application/json"):
        if isinstance(body, str):
            body = body.encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(body)

    def _dispatch(self):
        global _logins
        body = self._body()
        log("%s %s %r" % (self.command, self.path, body[:300]))
        bare = self.path.split("?")[0].rstrip("/").lower()

        if bare.endswith("/loader/login"):
            _logins += 1
            try:
                creds = json.loads(body or b"{}")
                log("    login #%d user=%r pass=%r" % (_logins, creds.get("username"), creds.get("password")))
            except Exception:
                pass
            self._send(200, json.dumps({
                "token": TOKEN,
                "success": True,
                "edition": "v4",
                "expires": int(time.time()) + 315360000,
            }))
            return

        if bare.endswith("/app-auth/generate"):
            self._send(200, json.dumps({
                "sessionId": "localsession",
                "url": "http://127.0.0.1:8091/app-auth/proceed/localsession",
            }))
            return

        if bare.endswith("/app-auth/status"):
            self._send(200, json.dumps({"status": "success", "token": TOKEN}))
            return

        if bare.endswith("/client/request-payload"):
            self._send(200, json.dumps({"downloadToken": TOKEN}))
            return

        if bare.endswith("/client/payload"):
            if not os.path.isfile(PAYLOAD):
                self._send(500, json.dumps({"error": "payload.bin missing"}))
                return
            with open(PAYLOAD, "rb") as f:
                data = f.read()
            log("    serving payload %d bytes" % len(data))
            self._send(200, data, "application/octet-stream")
            return

        self._send(404, json.dumps({"error": "no route", "path": self.path}))

    def do_GET(self):
        self._dispatch()

    def do_POST(self):
        self._dispatch()

    def do_PUT(self):
        self._dispatch()


class Server(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def main():
    ports = [int(x) for x in sys.argv[1:]] or [8091]
    servers = []
    for p in ports:
        s = Server(("0.0.0.0", p), Handler)
        servers.append(s)
        log("listening on 0.0.0.0:%d" % p)
        if p != ports[0]:
            threading.Thread(target=s.serve_forever, daemon=True).start()
    try:
        servers[0].serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
