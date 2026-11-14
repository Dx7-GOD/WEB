import re, sys
path = sys.argv[1] if len(sys.argv) > 1 else r'D:\vape\99b4747a.exe'
d = open(path, 'rb').read()
out = []
for m in re.finditer(rb'[\x20-\x7e]{4,}', d):
    out.append((m.start(), 'a', m.group().decode('latin1')))
for m in re.finditer(rb'(?:[\x20-\x7e]\x00){3,}', d):
    out.append((m.start(), 'w', m.group().decode('utf-16le', 'ignore')))
out.sort()
with open(r'D:\vape\work\allstrings.txt', 'w', encoding='utf-8') as f:
    for off, k, s in out:
        f.write(f'{off:08x} {k} {s}\n')
print(len(out))
