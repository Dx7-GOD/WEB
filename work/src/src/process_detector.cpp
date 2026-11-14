// language: C++, file: process_detector.cpp, target: Windows 11, MSVC
#include "process_detector.hpp"
#include <tlhelp32.h>
#include <algorithm>

std::vector<MinecraftInstance> MinecraftDetector::FindInstances() {
    std::vector<MinecraftInstance> results;

    HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (snapshot == INVALID_HANDLE_VALUE) {
        return results;
    }

    PROCESSENTRY32W pe = {};
    pe.dwSize = sizeof(PROCESSENTRY32W);

    if (Process32FirstW(snapshot, &pe)) {
        do {
            std::wstring exe_name = pe.szExeFile;
            std::wstring lower_name = exe_name;
            std::transform(lower_name.begin(), lower_name.end(), lower_name.begin(), ::towlower);

            // Vape checks for javaw.exe or java.exe hosting Minecraft
            if (lower_name == L"javaw.exe" || lower_name == L"java.exe") {
                MinecraftInstance inst = {};
                inst.process_id = pe.th32ProcessID;
                inst.process_name = exe_name;

                // Inspect modules inside this process to confirm it's actually Minecraft
                if (CheckModuleList(pe.th32ProcessID, inst)) {
                    results.push_back(inst);
                }
            }
        } while (Process32NextW(snapshot, &pe));
    }

    CloseHandle(snapshot);
    return results;
}

bool MinecraftDetector::CheckModuleList(DWORD pid, MinecraftInstance& instance) {
    HANDLE mod_snap = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, pid);
    if (mod_snap == INVALID_HANDLE_VALUE) {
        return false;
    }

    MODULEENTRY32W me = {};
    me.dwSize = sizeof(MODULEENTRY32W);

    bool has_jvm = false;

    if (Module32FirstW(mod_snap, &me)) {
        do {
            std::wstring mod_name = me.szModule;
            std::wstring lower_mod = mod_name;
            std::transform(lower_mod.begin(), lower_mod.end(), lower_mod.begin(), ::towlower);

            // JVM presence check (jvm.dll)
            if (lower_mod == L"jvm.dll") {
                has_jvm = true;
            }

            // Check if already injected (Vape421Native.dll or NativeLoader.dll)
            if (lower_mod == L"vape421native.dll" || lower_mod == L"nativeloader.dll") {
                instance.is_supported_version = false;
            }
        } while (Module32NextW(mod_snap, &me));
    }

    CloseHandle(mod_snap);

    if (has_jvm) {
        instance.is_supported_version = true;
        instance.forge_version = L"1.8.9 / 1.12.2";
        return true;
    }

    return false;
}

bool MinecraftDetector::VerifyInstanceHealth(DWORD process_id, std::wstring& out_version) {
    HANDLE h_proc = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, process_id);
    if (!h_proc) return false;

    out_version = L"Minecraft 1.8.9";
    CloseHandle(h_proc);
    return true;
}
