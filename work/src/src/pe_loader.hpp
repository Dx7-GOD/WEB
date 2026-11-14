// language: C++, file: pe_loader.hpp, target: Windows 11, MSVC
#pragma once
#include <windows.h>
#include <cstdint>

#pragma pack(push, 1)
// Parameter block passed to the remote injection stub (0x30 bytes)
// Disassembled from 0x140025ddc - 0x140025e1f
struct InjectionStubParams {
    uint64_t image_base;          // +0x00: Base address of mapped PE in target process
    uint32_t import_dir_rva;      // +0x08: IMAGE_DIRECTORY_ENTRY_IMPORT RVA
    uint32_t entry_point_rva;     // +0x0C: AddressOfEntryPoint RVA (DllMain)
    uint64_t reloc_dir_rva;       // +0x10: Relocation directory RVA / flags
    uint64_t fn_load_library_a;   // +0x18: Pointer to LoadLibraryA in kernel32.dll
    uint64_t fn_get_proc_address; // +0x20: Pointer to GetProcAddress in kernel32.dll
    uint32_t controller_port;     // +0x28: IPC controller socket port for handshake
    uint32_t reserved;            // +0x2C: Alignment padding
};
#pragma pack(pop)

// In-target manual PE import resolver and DllMain executor stub
// Disassembled from 0x1400255e8 - 0x1400256e7 in 99b4747a.exe
extern "C" DWORD WINAPI RemoteInjectionStub(InjectionStubParams* params);
