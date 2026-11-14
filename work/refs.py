import pefile, capstone, sys, struct
pe = pefile.PE(r'D:\vape\99b4747a.exe')
ib = pe.OPTIONAL_HEADER.ImageBase
text = next(s for s in pe.sections if s.Name.rstrip(b'\x00') == b'.text')
tdata = text.get_data()
base_rva = text.VirtualAddress
md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_64)
md.detail = True

targets = {}
def T(off, label):
    targets[pe.get_rva_from_offset(off) + ib] = label

T(0xea834, 'token=')
T(0xea880, 'downloadToken')
T(0xea890, 'downloadToken=')
T(0xea900, 'Vape421Native.dll-w')
T(0xea928, 'VAPE_ONLINE_BASE_URL')
T(0xea958, 'http://online.vape.chat')
T(0xeab90, 'Failed payload download')
T(0xead20, 'edition=v4&hwid=')
T(0xead38, '/api/v1/app-auth/generate')
T(0xead70, 'Unable to start browser login')
T(0xeadb0, 'app-auth/proceed')
T(0xeae10, '/api/v1/app-auth/status')
T(0xeae48, 'success')
T(0xeae50, 'token')
T(0xeae68, 'Browser login timed out')
T(0xeb070, 'JSON hwid')
T(0xeb0a0, '/loader/login')
T(0xeb0d0, 'Unable to log in')
T(0xeb920, 'VapeV4ControllerRewrite')
T(0xeb960, 'Username / email')
T(0xeb9a4, 'Login')
T(0xeb9b0, 'Login through browser')
T(0xebba8, 'Vape has finished loading')
T(0xebc18, 'Error')
T(0xec2a8, 'VAPE_ZEUS_ADDRESS')
T(0xec2c0, 'zeus-prod.vape.chat:8091')
T(0xec288, 'Local\\Vape421.')

hits = {}
for ins in md.disasm(tdata, ib + base_rva):
    for op in ins.operands:
        if op.type == capstone.x86.X86_OP_MEM and op.mem.base == capstone.x86.X86_REG_RIP:
            tgt = ins.address + ins.size + op.mem.disp
            if tgt in targets:
                hits.setdefault(targets[tgt], []).append(ins.address)

lines = []
for label, addrs in hits.items():
    lines.append(f'{label}: ' + ', '.join(hex(a) for a in addrs))
print('\n'.join(lines))

# pdata function ranges
print('\n--- functions containing hit addresses ---')
pe.parse_data_directories(directories=[pefile.DIRECTORY_ENTRY['IMAGE_DIRECTORY_ENTRY_EXCEPTION']])
funcs = []
if hasattr(pe, 'DIRECTORY_ENTRY_EXCEPTION'):
    for f in pe.DIRECTORY_ENTRY_EXCEPTION:
        funcs.append((f.struct.BeginAddress, f.struct.EndAddress))
funcs.sort()
allhits = sorted(set(a - ib for v in hits.values() for a in v))
for h in allhits:
    for b, e in funcs:
        if b <= h < e:
            print(f'{hex(h)} in {hex(b+ib)}..{hex(e+ib)}')
            break
