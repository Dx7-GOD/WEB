// language: C++, file: ipc_server.hpp, target: Windows 11, MSVC
// Local TCP server on port 8091 — receives commands from the injected Java payload.
// Runs on a background thread spawned from main.cpp after injection succeeds.
// Command format (UTF-8, newline-terminated):
//   "STREAMER_ON:<pid>\n"   → enable window capture exclusion
//   "STREAMER_OFF:<pid>\n"  → restore normal capture
#pragma once
#include <windows.h>
#include <cstdint>

// Spawn the IPC listener thread.  Call once after injection.
// port: the port the Java Streamer module connects to (8091).
void IpcServer_Start(uint16_t port);

// Signal the listener thread to stop (called on clean exit).
void IpcServer_Stop();
