import pefile, re, sys
p = pefile.PE(r'D:\vape\99b4747a.exe', fast_load=True)
print('entry', hex(p.OPTIONAL_HEADER.AddressOfEntryPoint), 'imagebase', hex(p.OPTIONAL_HEADER.ImageBase))
for s in p.sections:
    print(s.Name.decode().strip('\x00'), hex(s.VirtualAddress), hex(s.Misc_VirtualSize), hex(s.PointerToRawData), hex(s.SizeOfRawData))
print('--- resources ---')
p.parse_data_directories(directories=[pefile.DIRECTORY_ENTRY['IMAGE_DIRECTORY_ENTRY_RESOURCE']])
if hasattr(p, 'DIRECTORY_ENTRY_RESOURCE'):
    def walk(entries, depth=0):
        for e in entries:
            name = e.name if e.name is not None else e.id
            if hasattr(e, 'directory'):
                print('  '*depth + f'[{name}]')
                walk(e.directory.entries, depth+1)
            else:
                d = e.data.struct
                print('  '*depth + f'{name}: RVA {hex(d.OffsetToData)} size {hex(d.Size)}')
    walk(p.DIRECTORY_ENTRY_RESOURCE.entries)
print('--- imports ---')
p.parse_data_directories(directories=[pefile.DIRECTORY_ENTRY['IMAGE_DIRECTORY_ENTRY_IMPORT']])
for m in p.DIRECTORY_ENTRY_IMPORT:
    print(m.dll.decode(), ':', ', '.join((i.name or str(i.ordinal)).decode() if isinstance(i.name, bytes) else str(i.name) for i in m.imports[:80]))
