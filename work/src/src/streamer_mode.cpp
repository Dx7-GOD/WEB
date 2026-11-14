// language: C++, file: streamer_mode.cpp, target: Windows 11, MSVC
// Streamer Mode — native side.
// Receives IPC commands "STREAMER_ON" / "STREAMER_OFF" from the Java payload
// via the existing local controller socket (port 8091).
// On STREAMER_ON: SetWindowDisplayAffinity(mc_hwnd, WDA_EXCLUDEFROMCAPTURE)
//   → Minecraft renders normally on the physical monitor but is INVISIBLE to
//     any screen-capture API (OBS, Discord, XSplit, Windows Game Bar, etc.)
// On STREAMER_OFF: SetWindowDisplayAffinity(mc_hwnd, WDA_NONE)  — restores.
//
// WDA_EXCLUDEFROMCAPTURE = 0x00000011  (Win10 2004+, Win11)
// Falls back silently to WDA_MONITOR (0x00000001) on older builds.

#include <windows.h>
#include <string>
#include <cstdio>

// ── constants ────────────────────────────────────────────────────────────────
static constexpr UINT WDA_EXCLUDEFROMCAPTURE_VAL = 0x00000011u;
static constexpr UINT WDA_MONITOR_VAL             = 0x00000001u;
static constexpr UINT WDA_NONE_VAL                = 0x00000000u;

// ── helpers ──────────────────────────────────────────────────────────────────

// Find the topmost HWND owned by a given PID.
static HWND FindWindowByPid(DWORD pid) {
    struct EnumCtx { DWORD pid; HWND hwnd; };
    EnumCtx ctx{ pid, nullptr };
    EnumWindows([](HWND hwnd, LPARAM lp) -> BOOL {
        auto* c = reinterpret_cast<EnumCtx*>(lp);
        DWORD wpid = 0;
        GetWindowThreadProcessId(hwnd, &wpid);
        if (wpid == c->pid && IsWindowVisible(hwnd)) {
            c->hwnd = hwnd;
            return FALSE; // stop
        }
        return TRUE;
    }, reinterpret_cast<LPARAM>(&ctx));
    return ctx.hwnd;
}

// Apply (or clear) the display affinity on the Minecraft window.
// Returns true on success.
bool StreamerMode_Apply(DWORD minecraft_pid, bool enable) {
    HWND hwnd = FindWindowByPid(minecraft_pid);
    if (!hwnd) {
        fprintf(stderr, "[StreamerMode] HWND not found for PID %lu\n", minecraft_pid);
        return false;
    }

    UINT affinity = WDA_NONE_VAL;
    if (enable) {
        // Try WDA_EXCLUDEFROMCAPTURE first (Win10 2004+)
        if (SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE_VAL)) {
            fprintf(stdout, "[StreamerMode] WDA_EXCLUDEFROMCAPTURE set on HWND %p\n", hwnd);
            return true;
        }
        // Fallback: WDA_MONITOR hides from BitBlt-based capture (older OBS)
        affinity = WDA_MONITOR_VAL;
        fprintf(stdout, "[StreamerMode] Falling back to WDA_MONITOR on HWND %p\n", hwnd);
    }

    if (!SetWindowDisplayAffinity(hwnd, affinity)) {
        fprintf(stderr, "[StreamerMode] SetWindowDisplayAffinity failed: %lu\n", GetLastError());
        return false;
    }
    fprintf(stdout, "[StreamerMode] affinity cleared on HWND %p\n", hwnd);
    return true;
}

// ── IPC integration ──────────────────────────────────────────────────────────
// Drop this into the controller socket recv loop in network.cpp.
// When a payload IPC message starts with "STREAMER_ON:<pid>" or
// "STREAMER_OFF:<pid>", route here.
//
// Example in network.cpp recv handler:
//
//   if (msg.rfind("STREAMER_ON:", 0) == 0) {
//       DWORD pid = std::stoul(msg.substr(12));
//       StreamerMode_Apply(pid, true);
//   } else if (msg.rfind("STREAMER_OFF:", 0) == 0) {
//       DWORD pid = std::stoul(msg.substr(13));
//       StreamerMode_Apply(pid, false);
//   }
