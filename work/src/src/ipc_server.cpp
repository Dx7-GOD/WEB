// language: C++, file: ipc_server.cpp, target: Windows 11, MSVC
// Minimal TCP server that handles single-line commands from the Java payload.
// Winsock2 — link with ws2_32.lib.

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include "ipc_server.hpp"
#include "streamer_mode.hpp"

#include <winsock2.h>
#include <ws2tcpip.h>
#include <string>
#include <thread>
#include <atomic>
#include <cstdio>

#pragma comment(lib, "ws2_32.lib")

static std::atomic<bool> g_running{ false };
static std::thread       g_thread;
static SOCKET            g_listen_sock = INVALID_SOCKET;

// ── command dispatcher ────────────────────────────────────────────────────────
static void dispatch(const std::string& line) {
    // "STREAMER_ON:<pid>"
    if (line.rfind("STREAMER_ON:", 0) == 0) {
        DWORD pid = static_cast<DWORD>(std::stoul(line.substr(12)));
        StreamerMode_Apply(pid, true);
        return;
    }
    // "STREAMER_OFF:<pid>"
    if (line.rfind("STREAMER_OFF:", 0) == 0) {
        DWORD pid = static_cast<DWORD>(std::stoul(line.substr(13)));
        StreamerMode_Apply(pid, false);
        return;
    }
    fprintf(stderr, "[IpcServer] Unknown command: %s\n", line.c_str());
}

// ── accept loop ───────────────────────────────────────────────────────────────
static void server_loop(uint16_t port) {
    WSADATA wsa;
    if (WSAStartup(MAKEWORD(2, 2), &wsa) != 0) return;

    g_listen_sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (g_listen_sock == INVALID_SOCKET) { WSACleanup(); return; }

    // Allow reuse so restart after crash doesn't block
    int opt = 1;
    setsockopt(g_listen_sock, SOL_SOCKET, SO_REUSEADDR,
               reinterpret_cast<const char*>(&opt), sizeof(opt));

    sockaddr_in addr{};
    addr.sin_family      = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK); // 127.0.0.1 only
    addr.sin_port        = htons(port);

    if (bind(g_listen_sock, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) == SOCKET_ERROR) {
        fprintf(stderr, "[IpcServer] bind failed: %d\n", WSAGetLastError());
        closesocket(g_listen_sock);
        WSACleanup();
        return;
    }

    if (listen(g_listen_sock, 4) == SOCKET_ERROR) {
        closesocket(g_listen_sock);
        WSACleanup();
        return;
    }

    // Set a 500 ms accept timeout so we can check g_running
    DWORD timeout_ms = 500;
    setsockopt(g_listen_sock, SOL_SOCKET, SO_RCVTIMEO,
               reinterpret_cast<const char*>(&timeout_ms), sizeof(timeout_ms));

    fprintf(stdout, "[IpcServer] Listening on 127.0.0.1:%u\n", port);

    while (g_running.load()) {
        SOCKET client = accept(g_listen_sock, nullptr, nullptr);
        if (client == INVALID_SOCKET) continue; // timeout or stop

        // Read one newline-terminated line (commands are short)
        std::string line;
        char buf[256];
        int n;
        while ((n = recv(client, buf, sizeof(buf) - 1, 0)) > 0) {
            buf[n] = '\0';
            line += buf;
            if (line.find('\n') != std::string::npos) break;
        }

        closesocket(client);

        // Strip CR/LF
        while (!line.empty() && (line.back() == '\n' || line.back() == '\r'))
            line.pop_back();

        if (!line.empty()) dispatch(line);
    }

    closesocket(g_listen_sock);
    g_listen_sock = INVALID_SOCKET;
    WSACleanup();
}

// ── public API ────────────────────────────────────────────────────────────────
void IpcServer_Start(uint16_t port) {
    g_running = true;
    g_thread  = std::thread(server_loop, port);
}

void IpcServer_Stop() {
    g_running = false;
    if (g_listen_sock != INVALID_SOCKET) {
        closesocket(g_listen_sock); // unblocks accept()
    }
    if (g_thread.joinable()) g_thread.join();
}
