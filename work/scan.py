import re, sys, math, struct
path = sys.argv[1] if len(sys.argv) > 1 else r'D:\vape\99b4747a.exe'
d = open(path, 'rb').read()

kw = re.compile(rb'(?i)(vape|auth|key|licen|token|hwid|login|api\.|http|chat|inject|payload|serial|expire|valid|discord|panel|user|pass|subscri|expir|activate|session|bearer|client)')

asc = set(re.findall(rb'[\x20-\x7e]{6,}', d))
print('--- ascii hits ---')
for s in sorted(asc):
    try:
        t = s.decode('latin1')
    except Exception:
        continue
    if kw.search(s):
        print(t)

wide = set(m.decode('utf-16le', 'ignore') for m in re.findall(rb'(?:[\x20-\x7e]\x00){5,}', d))
print('--- wide hits ---')
for s in sorted(wide):
    b = s.encode('utf-16le', 'ignore')
    if kw.search(b):
        print(s)
