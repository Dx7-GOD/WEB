import ctypes as C
import struct
import sys

k32 = C.WinDLL('kernel32', use_last_error=True)
PROCESS_QUERY_INFORMATION, PROCESS_VM_READ = 0x0400, 0x0010

class MBI(C.Structure):
    _fields_ = [('BaseAddress', C.c_ulonglong), ('AllocationBase', C.c_ulonglong),
                ('AllocationProtect', C.c_ulong), ('__a1', C.c_ulong),
                ('RegionSize', C.c_ulonglong), ('State', C.c_ulong), ('Protect', C.c_ulong),
                ('Type', C.c_ulong), ('__a2', C.c_ulong)]

k32.OpenProcess.restype = C.c_void_p
k32.OpenProcess.argtypes = [C.c_ulong, C.c_int, C.c_ulong]
k32.VirtualQueryEx.restype = C.c_size_t
k32.VirtualQueryEx.argtypes = [C.c_void_p, C.c_void_p, C.POINTER(MBI), C.c_size_t]
k32.ReadProcessMemory.argtypes = [C.c_void_p, C.c_void_p, C.c_void_p, C.c_size_t, C.POINTER(C.c_size_t)]


def read(h, base, size):
    buf = C.create_string_buffer(size)
    got = C.c_size_t(0)
    if k32.ReadProcessMemory(h, C.c_void_p(base), buf, size, C.byref(got)) and got.value:
        return buf.raw[:got.value]
    return b''


def find_image(h, size_hint=None):
    mbi = MBI()
    addr = 0
    while k32.VirtualQueryEx(h, C.c_void_p(addr), C.byref(mbi), C.sizeof(mbi)):
        base, size = mbi.BaseAddress, mbi.RegionSize
        if mbi.State == 0x1000 and 0x20000 < size < (1 << 31):
            head = read(h, base, 0x1000)
            if head[:2] == b'MZ':
                e = struct.unpack_from('<I', head, 0x3c)[0] if len(head) > 0x40 else 0
                if 0 < e < 0x1000 and head[e:e+4] == b'PE\x00\x00':
                    magic = struct.unpack_from('<H', head, e + 24)[0]
                    if magic == 0x20b:
                        sz = struct.unpack_from('<I', head, e + 24 + 56)[0]
                        probe = read(h, base, min(size, 0x200000))
                        if b'Vape421Native' in probe or b'JNI_OnLoad' in probe:
                            return base, size, sz
        nxt = base + size
        if nxt <= addr:
            break
        addr = nxt
    return None


def dump(pid, out):
    h = k32.OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, 0, pid)
    if not h:
        raise SystemExit('OpenProcess failed')
    found = find_image(h)
    if not found:
        raise SystemExit('Vape421Native.dll image not found in pid %d' % pid)
    base, size, size_of_image = found
    print('image at 0x%x region=0x%x sizeOfImage=0x%x' % (base, size, size_of_image))
    img = read(h, base, size_of_image)
    if len(img) < size_of_image:
        print('short read: 0x%x of 0x%x' % (len(img), size_of_image))

    e = struct.unpack_from('<I', img, 0x3c)[0]
    opt = struct.unpack_from('<H', img, e + 20)[0]
    nsec = struct.unpack_from('<H', img, e + 6)[0]
    sec_align = struct.unpack_from('<I', img, e + 24 + 32)[0]
    file_align = struct.unpack_from('<I', img, e + 24 + 36)[0]
    size_of_headers = struct.unpack_from('<I', img, e + 24 + 60)[0]
    so = e + 24 + opt
    print('sec_align=0x%x file_align=0x%x headers=0x%x sections=%d' % (sec_align, file_align, size_of_headers, nsec))

    out_img = bytearray(size_of_image)
    out_img[:size_of_headers] = img[:size_of_headers]

    raw = size_of_headers
    for i in range(nsec):
        o = so + i * 40
        name = img[o:o+8].rstrip(b'\x00').decode('latin1')
        vsize, va, rsize = struct.unpack_from('<III', img, o + 8)
        if rsize == 0:
            rsize = vsize
        off = (raw + file_align - 1) // file_align * file_align
        body = img[va:va + rsize]
        out_img[off:off + len(body)] = body
        struct.pack_into('<I', out_img, o + 16, rsize)   # SizeOfRawData
        struct.pack_into('<I', out_img, o + 20, off)     # PointerToRawData
        print('  %-8s va=0x%08x vs=0x%08x raw=0x%08x -> file 0x%08x' % (name, va, vsize, rsize, off))
        raw = off + rsize
    out_img = out_img[:raw]
    open(out, 'wb').write(out_img)
    print('wrote %s (%d bytes)' % (out, len(out_img)))


if __name__ == '__main__':
    dump(int(sys.argv[1]), sys.argv[2])
