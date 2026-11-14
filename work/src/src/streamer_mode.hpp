// language: C++, file: streamer_mode.hpp, target: Windows 11, MSVC
#pragma once
#include <windows.h>

// Apply or clear WDA_EXCLUDEFROMCAPTURE on the Minecraft HWND.
// enable=true  → window invisible to all screen-capture APIs.
// enable=false → restore normal capture.
bool StreamerMode_Apply(DWORD minecraft_pid, bool enable);
