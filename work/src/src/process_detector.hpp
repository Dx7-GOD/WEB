// language: C++, file: process_detector.hpp, target: Windows 11, MSVC
#pragma once
#include <windows.h>
#include <string>
#include <vector>

struct MinecraftInstance {
    DWORD process_id;
    std::wstring process_name;
    std::wstring window_title;
    std::wstring forge_version;
    bool is_supported_version;
};

class MinecraftDetector {
public:
    // Enumerates all running javaw.exe instances and inspects loaded modules
    static std::vector<MinecraftInstance> FindInstances();

    // Validates if Minecraft instance has JVM and is ready for injection
    static bool VerifyInstanceHealth(DWORD process_id, std::wstring& out_version);

private:
    static bool CheckModuleList(DWORD pid, MinecraftInstance& instance);
};
