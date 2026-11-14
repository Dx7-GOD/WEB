// language: C++, file: injector.cpp, target: Windows 11, MSVC
#include "injector.hpp"
#include <iostream>
#include <winsock2.h>
#include <ws2tcpip.h>

#pragma comment(lib, "ws2_32.lib")

// The raw assembly stub extracted from 99b4747a.exe (VA: 0x1400255e8)
// This runs inside the target javaw.exe process space:
// Resolves imports from IMAGE_IMPORT_DESCRIPTOR using LoadLibraryA and GetProcAddress,
// then calls DllMain(ImageBase, DLL_PROCESS_ATTACH, NULL).
const uint8_t kRemoteStubBytes[] = {
    0x53,                               // push rbx
    0x55,                               // push rbp
    0x56,                               // push rsi
    0x57,                               // push rdi
    0x41, 0x56,                         // push r14
    0x41, 0x57,                         // push r15
    0x48, 0x83, 0xEC, 0x28,             // sub rsp, 0x28
    0x48, 0x89, 0xCB,                   // mov rbx, rcx (params)
    0x48, 0x85, 0xC9,                   // test rcx, rcx
    0x74, 0x7A,                         // je exit_fail
    0x48, 0x8B, 0x39,                   // mov rdi, [rcx] (image_base)
    0x48, 0x85, 0xFF,                   // test rdi, rdi
    0x74, 0x73,                         // je exit_fail
    0x83, 0x79, 0x08, 0x00,             // cmp dword ptr [rcx + 8], 0 (import_dir_rva)
    0x74, 0x59,                         // je call_entry
    0x8B, 0x71, 0x08,                   // mov esi, [rcx + 8]
    0x48, 0x01, 0xFE,                   // add rsi, rdi
    // import_loop:
    0x83, 0x7E, 0x0C, 0x00,             // cmp dword ptr [rsi + 0xC], 0 (pDescriptor->Name)
    0x74, 0x4D,                         // je call_entry
    0x8B, 0x4E, 0x0C,                   // mov ecx, [rsi + 0xC]
    0x48, 0x01, 0xF9,                   // add rcx, rdi (rcx = dll_name)
    0xFF, 0x53, 0x18,                   // call qword ptr [rbx + 0x18] (LoadLibraryA)
    0x48, 0x89, 0xC5,                   // mov rbp, rax (hModule)
    0x48, 0x85, 0xC0,                   // test rax, rax
    0x74, 0x3F,                         // je exit_fail
    0x8B, 0x0E,                         // mov ecx, [rsi] (OriginalFirstThunk)
    0x8B, 0x56, 0x10,                   // mov edx, [rsi + 0x10] (FirstThunk)
    0x85, 0xC9,                         // test ecx, ecx
    0x0F, 0x44, 0xCA,                   // cmove ecx, edx
    0x49, 0x8D, 0x34, 0x39,             // lea r14, [rcx + rdi] (thunk)
    0x49, 0x83, 0x3E, 0x00,             // cmp qword ptr [r14], 0
    0x74, 0x2A,                         // je next_descriptor
    0x49, 0x8D, 0x3C, 0x3A,             // lea r15, [rdx + rdi] (iat)
    // thunk_loop:
    0x49, 0x8B, 0x06,                   // mov rax, [r14]
    0x48, 0x89, 0xE9,                   // mov rcx, rbp (hModule)
    0x4C, 0x8B, 0x43, 0x20,             // mov r8, [rbx + 0x20] (GetProcAddress)
    0x48, 0x85, 0xC0,                   // test rax, rax
    0x79, 0x07,                         // jns by_name
    0x0F, 0xB7, 0xD0,                   // movzx edx, ax (ordinal)
    0xEB, 0x07,                         // jmp do_resolve
    // by_name:
    0x48, 0x8D, 0x54, 0x07, 0x02,       // lea rdx, [rdi + rax + 2] (name string)
    // do_resolve:
    0x41, 0xFF, 0xD0,                   // call r8 (GetProcAddress)
    0x49, 0x89, 0x07,                   // mov [r15], rax
    0x48, 0x85, 0xC0,                   // test rax, rax
    0x74, 0x14,                         // je exit_fail
    0x49, 0x83, 0xC6, 0x08,             // add r14, 8
    0x49, 0x83, 0xC7, 0x08,             // add r15, 8
    0x49, 0x83, 0x3E, 0x00,             // cmp qword ptr [r14], 0
    0x75, 0xCD,                         // jne thunk_loop
    // next_descriptor:
    0x48, 0x83, 0xC6, 0x14,             // add rsi, 0x14 (sizeof IMAGE_IMPORT_DESCRIPTOR)
    0x83, 0x7E, 0x0C, 0x00,             // cmp dword ptr [rsi + 0xC], 0
    0x75, 0x93,                         // jne import_loop
    // call_entry:
    0x83, 0x7B, 0x0C, 0x00,             // cmp dword ptr [rbx + 0x0C], 0 (entry_point_rva)
    0x74, 0x1C,                         // je exit_success
    0x48, 0x8B, 0x4B, 0x00,             // mov rcx, [rbx] (hInstance = image_base)
    0xBA, 0x01, 0x00, 0x00, 0x00,       // mov edx, DLL_PROCESS_ATTACH (1)
    0x45, 0x31, 0xC0,                   // xor r8d, r8d (lpReserved = 0)
    0x8B, 0x43, 0x0C,                   // mov eax, [rbx + 0x0C]
    0x48, 0x01, 0xF8,                   // add rax, rdi
    0xFF, 0xD0,                         // call rax (DllMain)
    0x85, 0xC0,                         // test eax, eax
    0x74, 0x09,                         // je exit_fail
    // exit_success:
    0xB8, 0x01, 0x00, 0x00, 0x00,       // mov eax, 1
    0xEB, 0x05,                         // jmp epilogue
    // exit_fail:
    0x31, 0xC0,                         // xor eax, eax (0)
    // epilogue:
    0x48, 0x83, 0xC4, 0x28,             // add rsp, 0x28
    0x41, 0x5F,                         // pop r15
    0x41, 0x5E,                         // pop r14
    0x5F,                               // pop rdi
    0x5E,                               // pop rsi
    0x5D,                               // pop rbp
    0x5B,                               // pop rbx
    0xC3                                // ret
};

VapeInjector::VapeInjector() {}
VapeInjector::~VapeInjector() {}

InjectionResult VapeInjector::InjectPayload(DWORD process_id, const std::vector<uint8_t>& raw_pe_bytes, uint16_t controller_port) {
    // 1. Open target process (javaw.exe)
    HANDLE h_process = OpenProcess(PROCESS_ALL_ACCESS, FALSE, process_id);
    if (!h_process || h_process == INVALID_HANDLE_VALUE) {
        last_error_ = L"Failed to open Minecraft process";
        return InjectionResult::FailedOpenProcess;
    }

    // Validate PE DOS & NT Headers
    auto* dos_header = reinterpret_cast<const IMAGE_DOS_HEADER*>(raw_pe_bytes.data());
    if (dos_header->e_magic != IMAGE_DOS_SIGNATURE) {
        CloseHandle(h_process);
        last_error_ = L"Invalid DOS signature in payload";
        return InjectionResult::FailedAllocatePayloadMemory;
    }

    auto* nt_headers = reinterpret_cast<const IMAGE_NT_HEADERS64*>(raw_pe_bytes.data() + dos_header->e_lfanew);
    if (nt_headers->Signature != IMAGE_NT_SIGNATURE) {
        CloseHandle(h_process);
        last_error_ = L"Invalid NT signature in payload";
        return InjectionResult::FailedAllocatePayloadMemory;
    }

    size_t size_of_image = nt_headers->OptionalHeader.SizeOfImage;

    // 2. Allocate remote memory for mapped payload
    void* remote_payload = VirtualAllocEx(
        h_process,
        nullptr,
        size_of_image,
        MEM_COMMIT | MEM_RESERVE,
        PAGE_EXECUTE_READWRITE
    );

    if (!remote_payload) {
        CloseHandle(h_process);
        last_error_ = L"Failed to allocate memory in target process for payload";
        return InjectionResult::FailedAllocatePayloadMemory;
    }

    // 3. Map PE Sections into remote process
    if (!MapImageSections(h_process, raw_pe_bytes.data(), raw_pe_bytes.size(), remote_payload)) {
        VirtualFreeEx(h_process, remote_payload, 0, MEM_RELEASE);
        CloseHandle(h_process);
        last_error_ = L"Failed to write mapped payload into target process";
        return InjectionResult::FailedWritePayload;
    }

    // 4. Allocate remote memory for InjectionStubParams and executable stub
    size_t stub_alloc_size = sizeof(InjectionStubParams) + sizeof(kRemoteStubBytes);
    void* remote_stub = VirtualAllocEx(
        h_process,
        nullptr,
        stub_alloc_size,
        MEM_COMMIT | MEM_RESERVE,
        PAGE_EXECUTE_READWRITE
    );

    if (!remote_stub) {
        VirtualFreeEx(h_process, remote_payload, 0, MEM_RELEASE);
        CloseHandle(h_process);
        last_error_ = L"Failed to allocate memory for injection stub";
        return InjectionResult::FailedAllocateStubMemory;
    }

    // 5. Build parameters block
    HMODULE h_kernel32 = GetModuleHandleW(L"kernel32.dll");
    InjectionStubParams params = {};
    params.image_base = reinterpret_cast<uint64_t>(remote_payload);
    params.import_dir_rva = nt_headers->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_IMPORT].VirtualAddress;
    params.entry_point_rva = nt_headers->OptionalHeader.AddressOfEntryPoint;
    params.fn_load_library_a = reinterpret_cast<uint64_t>(GetProcAddress(h_kernel32, "LoadLibraryA"));
    params.fn_get_proc_address = reinterpret_cast<uint64_t>(GetProcAddress(h_kernel32, "GetProcAddress"));
    params.controller_port = controller_port;

    SIZE_T bytes_written = 0;
    if (!WriteProcessMemory(h_process, remote_stub, &params, sizeof(params), &bytes_written) || bytes_written != sizeof(params)) {
        VirtualFreeEx(h_process, remote_stub, 0, MEM_RELEASE);
        VirtualFreeEx(h_process, remote_payload, 0, MEM_RELEASE);
        CloseHandle(h_process);
        last_error_ = L"Failed to write injection stub parameters";
        return InjectionResult::FailedWriteStubParameters;
    }

    // Write stub code right after parameters
    void* remote_code = reinterpret_cast<uint8_t*>(remote_stub) + sizeof(InjectionStubParams);
    if (!WriteProcessMemory(h_process, remote_code, kRemoteStubBytes, sizeof(kRemoteStubBytes), &bytes_written) || bytes_written != sizeof(kRemoteStubBytes)) {
        VirtualFreeEx(h_process, remote_stub, 0, MEM_RELEASE);
        VirtualFreeEx(h_process, remote_payload, 0, MEM_RELEASE);
        CloseHandle(h_process);
        last_error_ = L"Failed to write injection stub code";
        return InjectionResult::FailedWriteStubCode;
    }

    // 6. Execute injection stub in target process via CreateRemoteThread
    HANDLE h_thread = CreateRemoteThread(
        h_process,
        nullptr,
        0,
        reinterpret_cast<LPTHREAD_START_ROUTINE>(remote_code),
        remote_stub, // Pass address of InjectionStubParams as RCX
        0,
        nullptr
    );

    if (!h_thread) {
        VirtualFreeEx(h_process, remote_stub, 0, MEM_RELEASE);
        VirtualFreeEx(h_process, remote_payload, 0, MEM_RELEASE);
        CloseHandle(h_process);
        last_error_ = L"Failed to execute injection stub in target process";
        return InjectionResult::FailedExecuteStub;
    }

    // 7. Wait for stub completion (timeout: 15 seconds)
    DWORD wait_res = WaitForSingleObject(h_thread, 15000);
    if (wait_res == WAIT_TIMEOUT) {
        CloseHandle(h_thread);
        CloseHandle(h_process);
        last_error_ = L"Injection stub execution timed out";
        return InjectionResult::StubTimedOut;
    }

    DWORD exit_code = 0;
    GetExitCodeThread(h_thread, &exit_code);
    CloseHandle(h_thread);

    // Free the bootstrap stub (it has already finished running)
    VirtualFreeEx(h_process, remote_stub, 0, MEM_RELEASE);
    CloseHandle(h_process);

    if (exit_code != 1) {
        last_error_ = L"Injection stub returned failure (DllMain or import resolution failed)";
        return InjectionResult::StubReturnedFailure;
    }

    // 8. Confirm IPC socket bootstrap handshake with Vape controller
    if (!PerformSocketHandshake(controller_port, 5000)) {
        last_error_ = L"Product DLL did not acknowledge the socket bootstrap";
        return InjectionResult::BootstrapFailedSocket;
    }

    last_error_ = L"Vape has finished loading";
    return InjectionResult::Success;
}

bool VapeInjector::MapImageSections(HANDLE h_process, const uint8_t* pe_data, size_t pe_size, void* remote_base) {
    auto* dos_header = reinterpret_cast<const IMAGE_DOS_HEADER*>(pe_data);
    auto* nt_headers = reinterpret_cast<const IMAGE_NT_HEADERS64*>(pe_data + dos_header->e_lfanew);

    // 1. Write PE Headers
    SIZE_T bytes_written = 0;
    if (!WriteProcessMemory(h_process, remote_base, pe_data, nt_headers->OptionalHeader.SizeOfHeaders, &bytes_written)) {
        return false;
    }

    // 2. Map Each Section
    auto* section = IMAGE_FIRST_SECTION(nt_headers);
    for (WORD i = 0; i < nt_headers->FileHeader.NumberOfSections; ++i, ++section) {
        if (section->SizeOfRawData == 0) continue;

        void* dest = reinterpret_cast<uint8_t*>(remote_base) + section->VirtualAddress;
        const void* src = pe_data + section->PointerToRawData;
        if (!WriteProcessMemory(h_process, dest, src, section->SizeOfRawData, &bytes_written)) {
            return false;
        }
    }

    return true;
}

bool VapeInjector::PerformSocketHandshake(uint16_t port, uint32_t timeout_ms) {
    SOCKET sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (sock == INVALID_SOCKET) return false;

    sockaddr_in addr = {};
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port);
    inet_pton(AF_INET, "127.0.0.1", &addr.sin_addr);

    // Attempt connection with timeout
    u_long mode = 1;
    ioctlsocket(sock, FIONBIO, &mode);
    connect(sock, reinterpret_cast<sockaddr*>(&addr), sizeof(addr));

    fd_set write_set;
    FD_ZERO(&write_set);
    FD_SET(sock, &write_set);

    timeval tv;
    tv.tv_sec = timeout_ms / 1000;
    tv.tv_usec = (timeout_ms % 1000) * 1000;

    int res = select(0, nullptr, &write_set, nullptr, &tv);
    closesocket(sock);
    return res > 0;
}
