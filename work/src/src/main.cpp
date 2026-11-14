// language: C++, file: main.cpp, target: Windows 11, MSVC
// Reconstructed source code of Manthe Vape V4 Launcher (99b4747a.exe / VapeV4ControllerRewrite)
#include <windows.h>
#include <iostream>
#include <vector>
#include <string>

#include "injector.hpp"
#include "process_detector.hpp"
#include "network.hpp"
#include "ipc_server.hpp"

enum class AppState {
    CheckSingleInstance,
    LoginPrompt,
    WaitingForMinecraft,
    DownloadingPayload,
    Injecting,
    Finished,
    Error
};

int WINAPI wWinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PWSTR pCmdLine, int nCmdShow) {
    // 1. Single Instance Guard (Mutex: Local\Vape421.)
    HANDLE h_mutex = CreateMutexW(nullptr, TRUE, L"Local\\Vape421.");
    if (GetLastError() == ERROR_ALREADY_EXISTS) {
        MessageBoxW(nullptr, L"A Loader bootstrap already exists for this process", L"Vape V4", MB_ICONWARNING | MB_OK);
        return 1;
    }

    AppState state = AppState::WaitingForMinecraft;
    VapeNetworkClient net_client;
    VapeInjector injector;

    std::wstring status_text = L"Open Minecraft to continue";
    std::string auth_token;
    std::vector<uint8_t> payload_dll_bytes;

    std::wcout << L"[Vape V4 Launcher] Initializing controller...\n";

    // 2. Main Controller Execution Loop
    bool running = true;
    while (running) {
        switch (state) {
            case AppState::WaitingForMinecraft: {
                auto instances = MinecraftDetector::FindInstances();
                if (instances.empty()) {
                    status_text = L"No Minecraft found. Open Minecraft to continue";
                    Sleep(1000);
                    break;
                }

                if (instances.size() > 1) {
                    status_text = L"Select a Minecraft to use";
                }

                auto target = instances[0];
                std::wcout << L"[+] Target Minecraft process detected: PID " << target.process_id << L"\n";
                state = AppState::DownloadingPayload;
                break;
            }

            case AppState::DownloadingPayload: {
                status_text = L"Requesting payload from Vape.chat servers...";
                std::string download_token;
                
                // Fetch dynamic payload from server
                if (!net_client.RequestPayload(auth_token, download_token)) {
                    std::wcout << L"[-] Failed to download payload from server\n";
                    state = AppState::Error;
                    break;
                }

                if (!net_client.DownloadPayload(download_token, payload_dll_bytes)) {
                    std::wcout << L"[-] Payload download stream failed\n";
                    state = AppState::Error;
                    break;
                }

                state = AppState::Injecting;
                break;
            }

            case AppState::Injecting: {
                status_text = L"Injecting into target process...";
                auto instances = MinecraftDetector::FindInstances();
                if (instances.empty()) {
                    state = AppState::WaitingForMinecraft;
                    break;
                }

                DWORD target_pid = instances[0].process_id;
                uint16_t controller_port = 8091; // Local IPC controller socket port

                InjectionResult res = injector.InjectPayload(target_pid, payload_dll_bytes, controller_port);
                if (res != InjectionResult::Success) {
                    std::wcout << L"[-] Injection failed: " << injector.GetLastErrorString() << L"\n";
                    state = AppState::Error;
                    break;
                }

                std::wcout << L"[+] Vape has finished loading!\n";
                // Start IPC server so Java payload can send STREAMER_ON/OFF
                IpcServer_Start(controller_port);
                state = AppState::Finished;
                break;
            }

            case AppState::Finished: {
                running = false;
                break;
            }

            case AppState::Error: {
                std::wcout << L"[!] Controller encountered an error: " << injector.GetLastErrorString() << L"\n";
                running = false;
                break;
            }
        }
    }

    if (h_mutex) {
        CloseHandle(h_mutex);
    }
    IpcServer_Stop();

    return 0;
}
