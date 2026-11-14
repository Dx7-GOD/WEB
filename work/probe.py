import json, sys, urllib.request, urllib.error, socket

def req(url, data=None, headers=None, timeout=8):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, data=data, headers=headers or {}), timeout=timeout)
        b = r.read()
        return r.status, b
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        return None, repr(e).encode()

tests = [
    ('POST', 'http://zeus-prod.vape.chat:8091/loader/login',
     json.dumps({"username": "test", "password": "test", "hwid": "deadbeef"}).encode(),
     {'Content-Type': 'application/json; charset=utf-8'}),
    ('GET', 'http://online.vape.chat/api/v1/client/request-payload', None, {}),
    ('POST', 'http://online.vape.chat/api/v1/client/request-payload', b'token=x&edition=v4&hwid=deadbeef',
     {'Content-Type': 'application/x-www-form-urlencoded'}),
    ('GET', 'http://online.vape.chat/api/v1/client/payload?token=x', None, {}),
    ('POST', 'http://zeus-prod.vape.chat:8091/api/v1/app-auth/generate', b'{}',
     {'Content-Type': 'application/json; charset=utf-8'}),
]
for m, u, d, h in tests:
    st, b = req(u, d, h)
    print('=' * 60)
    print(m, u, '->', st)
    print(b[:800])
