import pefile, capstone, sys
pe = pefile.PE(r'D:\vape\99b4747a.exe')
ib = pe.OPTIONAL_HEADER.ImageBase
text = next(s for s in pe.sections if s.Name.rstrip(b'\x00') == b'.text')
tdata = text.get_data(); tbase = ib + text.VirtualAddress

# imports map
pe.parse_data_directories(directories=[pefile.DIRECTORY_ENTRY['IMAGE_DIRECTORY_ENTRY_IMPORT']])
imp = {}
for m in pe.DIRECTORY_ENTRY_IMPORT:
    for i in m.imports:
        if i.name:
            imp[ib + i.address] = m.dll.decode() + '!' + i.name.decode()

md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_64)
md.detail = True

start = int(sys.argv[1], 16); end = int(sys.argv[2], 16)
code = tdata[start - tbase:end - tbase]
for ins in md.disasm(code, start):
    ann = ''
    for op in ins.operands:
        if op.type == capstone.x86.X86_OP_MEM and op.mem.base == capstone.x86.X86_REG_RIP:
            t = ins.address + ins.size + op.mem.disp
            if t in imp:
                ann += f'  ; {imp[t]}'
            else:
                try:
                    off = pe.get_offset_from_rva(t - ib)
                    s = pe.get_string_at_rva(t - ib, 60)
                    if s: ann += '  ; "' + s.decode('latin1', 'replace') + '"'
                except Exception:
                    pass
    print(f'{ins.address:x}: {ins.mnemonic} {ins.op_str}{ann}')
