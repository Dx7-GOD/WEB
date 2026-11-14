import pefile, capstone, sys
pe = pefile.PE(r'D:\vape\99b4747a.exe')
ib = pe.OPTIONAL_HEADER.ImageBase
text = next(s for s in pe.sections if s.Name.rstrip(b'\x00') == b'.text')
tdata = text.get_data(); tbase = ib + text.VirtualAddress
md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_64)
md.detail = True
want = [int(x, 16) for x in sys.argv[1:]]
callers = {w: [] for w in want}
for ins in md.disasm(tdata, tbase):
    if ins.mnemonic in ('call', 'jmp') and ins.operands and ins.operands[0].type == capstone.x86.X86_OP_IMM:
        t = ins.operands[0].imm
        if t in callers:
            callers[t].append((ins.address, ins.mnemonic))
for w, cs in callers.items():
    print(hex(w), '->', ', '.join(f'{hex(a)}({m})' for a, m in cs) or 'none')
