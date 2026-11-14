#!/usr/bin/env python3
"""
Vape V4 controller (99b4747a.exe) - key verification bypass patcher.

Repoints the two hardcoded endpoints at the local relay:

    http://online.vape.chat          -> http://127.0.0.1:8091
    zeus-prod.vape.chat:8091         -> 127.0.0.1:8091

The launcher then performs its normal login/payload handshake against the
relay, which accepts every credential. No key, account or HWID is validated.

Usage:
    python patch_exe.py 99b4747a.exe 99b4747a_patched.exe
"""
import os
import sys

ONLINE_URL_OFF = 0xEA958   # UTF-16 default of VAPE_ONLINE_BASE_URL
ZEUS_HOST_OFF = 0xEC2C0    # ANSI default of VAPE_ZEUS_ADDRESS
ONLINE_URL_OLD = "http://online.vape.chat"
ZEUS_HOST_OLD = "zeus-prod.vape.chat:8091"

PATCHES = [
    (ONLINE_URL_OFF, "utf-16-le", ONLINE_URL_OLD, "http://127.0.0.1:8091"),
    (ZEUS_HOST_OFF, "ascii", ZEUS_HOST_OLD, "127.0.0.1:8091"),
]


def patch(src, dst):
    data = bytearray(open(src, "rb").read())
    for off, enc, old, new in PATCHES:
        cur = bytes(data[off:off + len(old.encode(enc))]).decode(enc, "replace")
        if cur != old:
            raise SystemExit("unexpected bytes at 0x%x: %r (expected %r)" % (off, cur, old))
        blob = new.encode(enc) + (b"\x00\x00" if enc == "utf-16-le" else b"\x00")
        data[off:off + len(blob)] = blob
        print("[+] 0x%06x %-16s %s -> %s" % (off, enc, old, new))
    open(dst, "wb").write(data)
    print("[+] wrote %s (%d bytes)" % (dst, len(data)))


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "99b4747a.exe"
    dst = sys.argv[2] if len(sys.argv) > 2 else os.path.splitext(src)[0] + "_patched.exe"
    patch(src, dst)
