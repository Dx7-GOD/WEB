#!/usr/bin/env python3
"""
inject_streamer.py  v2
Injects Streamer + StreamerModeState into Vape V4 payload.bin.
Properly replaces ModManager.class (no duplicate entry).
"""

import struct, zipfile, shutil, os, io

SRC      = r"d:\vape\bypass\payload.bin"
DST      = r"d:\vape\bypass\payload_streamer.bin"
CLS_DIR  = r"d:\vape\work\java_out"

STREAMER_CLASS = "gg/vape/module/utility/Streamer"
INIT_DESC      = "()V"
MM_ENTRY       = "gg/vape/manager/ModManager.class"

TAG_UTF8 = 1; TAG_CLASS = 7; TAG_METHODREF = 10; TAG_NAMEANDTYPE = 12

# ── constant-pool helpers ─────────────────────────────────────────────────────

def u2(d, o): return struct.unpack_from(">H", d, o)[0]
def u4(d, o): return struct.unpack_from(">I", d, o)[0]

def read_cp(data, off):
    count = u2(data, off); off += 2
    entries = [None]
    i = 1
    while i < count:
        tag = data[off]; off += 1
        if tag == TAG_UTF8:
            ln = u2(data, off); off += 2
            entries.append((tag, data[off:off+ln])); off += ln
        elif tag in (TAG_CLASS, 8, 16, 19, 20):
            entries.append((tag, u2(data, off))); off += 2
        elif tag in (TAG_METHODREF, 9, 11, TAG_NAMEANDTYPE, 17, 18):
            entries.append((tag, (u2(data, off), u2(data, off+2)))); off += 4
        elif tag in (3, 4): entries.append((tag, data[off:off+4])); off += 4
        elif tag in (5, 6):
            entries.append((tag, data[off:off+8])); off += 8
            entries.append(None); i += 1
        elif tag == 15: entries.append((tag, data[off:off+3])); off += 3
        else: raise ValueError(f"Unknown CP tag {tag} @ {off-1:#x}")
        i += 1
    return entries, off

def encode_cp(entries):
    out = bytearray()
    i = 1
    while i < len(entries):
        e = entries[i]
        if e is None: i += 1; continue
        tag = e[0]; out.append(tag)
        if tag == TAG_UTF8:
            out += struct.pack(">H", len(e[1])) + e[1]
        elif tag in (TAG_CLASS, 8, 16, 19, 20):
            out += struct.pack(">H", e[1])
        elif tag in (TAG_METHODREF, 9, 11, TAG_NAMEANDTYPE, 17, 18):
            out += struct.pack(">HH", *e[1])
        elif tag in (3, 4, 5, 6, 15):
            out += e[1]
            if tag in (5, 6): i += 1
        i += 1
    return bytes(out)

def find_utf8(ent, s):
    b = s.encode()
    for i, e in enumerate(ent):
        if e and e[0] == TAG_UTF8 and e[1] == b: return i
    return -1

def find_class(ent, ni):
    for i, e in enumerate(ent):
        if e and e[0] == TAG_CLASS and e[1] == ni: return i
    return -1

def find_nat(ent, ni, di):
    for i, e in enumerate(ent):
        if e and e[0] == TAG_NAMEANDTYPE and e[1] == (ni, di): return i
    return -1

def find_mr(ent, ci, ni):
    for i, e in enumerate(ent):
        if e and e[0] == TAG_METHODREF and e[1] == (ci, ni): return i
    return -1

def get_or_add_utf8(ent, s):
    i = find_utf8(ent, s)
    if i == -1: i = len(ent); ent.append((TAG_UTF8, s.encode())); print(f"  +UTF8 #{i} {s!r}")
    return i

def get_or_add_class(ent, name):
    ni = get_or_add_utf8(ent, name)
    i = find_class(ent, ni)
    if i == -1: i = len(ent); ent.append((TAG_CLASS, ni)); print(f"  +Class #{i} {name}")
    return i

def get_or_add_nat(ent, mn, desc):
    ni = get_or_add_utf8(ent, mn); di = get_or_add_utf8(ent, desc)
    i = find_nat(ent, ni, di)
    if i == -1: i = len(ent); ent.append((TAG_NAMEANDTYPE, (ni, di))); print(f"  +NAT #{i}")
    return i

def get_or_add_mr(ent, cname, mn, desc):
    ci = get_or_add_class(ent, cname); ni = get_or_add_nat(ent, mn, desc)
    i = find_mr(ent, ci, ni)
    if i == -1: i = len(ent); ent.append((TAG_METHODREF, (ci, ni))); print(f"  +MR #{i} {cname}.{mn}{desc}")
    return i

# ── bytecode block ────────────────────────────────────────────────────────────

def mod_block(class_idx, mr_idx, slot):
    return bytes([
        0x2c,                                              # aload_2
        0x10, slot & 0xff,                                 # bipush <slot>
        0xBB, class_idx >> 8, class_idx & 0xff,            # new
        0x59,                                              # dup
        0xB7, mr_idx >> 8, mr_idx & 0xff,                  # invokespecial
        0x53,                                              # aastore
    ])

# ── code-attribute length fixer ───────────────────────────────────────────────

def fix_code_attrs(data, insert_offset, insert_len):
    """
    Walk through every attribute in the class file looking for Code attributes.
    For each one, if its code[] region contains insert_offset, patch
    code_length and attribute_length accordingly.

    We locate Code attrs by scanning for the 2-byte code_name_index that
    refers to the UTF8 "Code" string, then verifying the structure.
    """
    # First, re-read CP to find the index of "Code"
    entries, after_cp = read_cp(data, 8)
    code_name_idx = find_utf8(entries, "Code")
    if code_name_idx == -1:
        print("[!] 'Code' not in CP — cannot fix attr lengths"); return data

    code_name_bytes = struct.pack(">H", code_name_idx)
    out = bytearray(data)
    pos = after_cp
    end = len(data)

    # Walk the class file linearly looking for attribute_name_index == code_name_idx
    # We won't do a full class parse; instead scan and validate.
    scan = after_cp
    patched = 0
    while scan < end - 12:
        if data[scan:scan+2] == code_name_bytes:
            # Candidate Code attribute:
            # [scan]   attribute_name_index  u2
            # [scan+2] attribute_length      u4
            # [scan+6] max_stack             u2
            # [scan+8] max_locals            u2
            # [scan+10] code_length          u4
            attr_len  = u4(data, scan+2)
            code_len  = u4(data, scan+10)
            # Sanity check
            if (100 < code_len < 50000
                    and code_len < attr_len
                    and scan + 6 + attr_len <= end):
                # Does the code region contain our insert_offset?
                code_start = scan + 14  # after name+attrlen+maxstack+maxlocals+codelen
                code_end   = code_start + code_len
                if code_start <= insert_offset <= code_end:
                    new_code_len = code_len + insert_len
                    new_attr_len = attr_len + insert_len
                    struct.pack_into(">I", out, scan+2,  new_attr_len)
                    struct.pack_into(">I", out, scan+10, new_code_len)
                    print(f"  [fix] Code attr @ {scan:#x}: code_len {code_len}→{new_code_len}, attr_len {attr_len}→{new_attr_len}")
                    patched += 1
        scan += 1

    if not patched:
        print("[!] No Code attr patched — JVM may reject the class")
    return bytes(out)

# ── main patcher ──────────────────────────────────────────────────────────────

def patch_modmanager(raw):
    assert raw[:4] == b"\xca\xfe\xba\xbe"
    entries, after_cp = read_cp(raw, 8)

    # Add Streamer to CP
    s_ci  = get_or_add_class(entries, STREAMER_CLASS)
    s_mri = get_or_add_mr(entries,    STREAMER_CLASS, "<init>", INIT_DESC)

    new_cp_data  = encode_cp(entries)
    new_cp_count = len(entries)

    rebuilt = raw[:8] + struct.pack(">H", new_cp_count) + new_cp_data + raw[after_cp:]
    print(f"[*] Class rebuilt {len(raw)} → {len(rebuilt)} bytes, CP {new_cp_count}")

    # Re-read CP from rebuilt to get final indices
    ent2, acp2 = read_cp(rebuilt, 8)

    panic_ci  = find_class(ent2, find_utf8(ent2, "gg/vape/module/utility/Panic"))
    init_ni   = find_utf8(ent2, "<init>"); void_di = find_utf8(ent2, INIT_DESC)
    panic_nat = find_nat(ent2, init_ni, void_di)
    panic_mri = find_mr(ent2, panic_ci, panic_nat)

    s_ci2  = find_class(ent2, find_utf8(ent2, STREAMER_CLASS))
    s_nat2 = find_nat(ent2, init_ni, void_di)
    s_mri2 = find_mr(ent2, s_ci2, s_nat2)

    print(f"[*] Panic  class=#{panic_ci} init=#{panic_mri}")
    print(f"[*] Stream class=#{s_ci2}   init=#{s_mri2}")

    # Find Panic block
    panic_blk = mod_block(panic_ci, panic_mri, 36)
    pos = rebuilt.find(panic_blk)
    if pos == -1:
        raise RuntimeError("Panic bytecode block not found in rebuilt class")
    print(f"[*] Panic block @ {pos:#x}")

    # Patch array size bipush 61 → 62
    # Search backward from pos for 0x10 0x3d
    region = rebuilt[acp2:pos]
    ri = region.rfind(bytes([0x10, 0x3d]))
    if ri == -1: raise RuntimeError("bipush 61 not found")
    abs_size = acp2 + ri
    data = bytearray(rebuilt)
    data[abs_size + 1] = 62
    print(f"[*] Array size 61→62 @ {abs_size:#x}")

    # Patch subsequent slot bipushes after Panic block
    after_panic = pos + len(panic_blk)
    scan = after_panic
    n_patched = 0
    limit = after_panic + 2000
    while scan < limit and scan < len(data) - 1:
        if data[scan] == 0x10 and 37 <= data[scan+1] <= 60:
            data[scan+1] += 1; n_patched += 1; scan += 2; continue
        scan += 1
    print(f"[*] Patched {n_patched} subsequent slot indices")

    # Fix Code attribute lengths BEFORE splicing
    s_blk = mod_block(s_ci2, s_mri2, 37)
    data = bytearray(fix_code_attrs(bytes(data), pos + len(panic_blk), len(s_blk)))

    # Splice Streamer block after Panic block
    final = bytes(data[:after_panic]) + s_blk + bytes(data[after_panic:])
    print(f"[*] Spliced Streamer block ({len(s_blk)} bytes) → final {len(final)} bytes")
    return final


def rebuild_zip(src, dst, replacements, additions):
    """
    Copy src ZIP to dst, replacing entries in replacements (dict name→bytes)
    and adding entries in additions (dict name→bytes).
    Skips any entries whose names are in additions (they go in fresh).
    """
    skip = set(replacements) | set(additions)
    with zipfile.ZipFile(src, "r") as zin, \
         zipfile.ZipFile(dst, "w", compression=zipfile.ZIP_DEFLATED, allowZip64=True) as zout:
        for item in zin.infolist():
            if item.filename in replacements:
                data = replacements[item.filename]
                zout.writestr(item.filename, data)
                print(f"  [replaced] {item.filename} ({len(data)} bytes)")
            elif item.filename not in additions:
                zout.writestr(item, zin.read(item.filename))
        for name, data in additions.items():
            zout.writestr(name, data)
            print(f"  [added] {name} ({len(data)} bytes)")


def main():
    print(f"[*] {SRC} → {DST}")
    with zipfile.ZipFile(SRC, "r") as z:
        orig_mm = z.read(MM_ENTRY)

    try:
        patched_mm = patch_modmanager(orig_mm)
        replacements = {MM_ENTRY: patched_mm}
    except Exception as e:
        import traceback; traceback.print_exc()
        print(f"[!] ModManager patch failed ({e}) — will not register Streamer in init()")
        replacements = {}

    additions = {}
    for root, _, files in os.walk(CLS_DIR):
        for f in files:
            if f.endswith(".class"):
                full = os.path.join(root, f)
                rel  = os.path.relpath(full, CLS_DIR).replace("\\", "/")
                with open(full, "rb") as fh: additions[rel] = fh.read()

    rebuild_zip(SRC, DST, replacements, additions)
    print(f"\n[+] payload_streamer.bin written ({os.path.getsize(DST):,} bytes)")


if __name__ == "__main__":
    main()
