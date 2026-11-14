import pefile
pe = pefile.PE(r'D:\vape\99b4747a.exe')
pe.parse_data_directories(directories=[pefile.DIRECTORY_ENTRY['IMAGE_DIRECTORY_ENTRY_RESOURCE']])
for e in pe.DIRECTORY_ENTRY_RESOURCE.entries:
    for e2 in e.directory.entries:
        for e3 in e2.directory.entries:
            d = e3.data.struct
            data = pe.get_data(d.OffsetToData, d.Size)
            print(e.id, e2.id, e3.id, hex(d.OffsetToData), d.Size, data[:16].hex(), data[:24])
