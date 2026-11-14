// language: C++, file: network.hpp, target: Windows 11, MSVC
#pragma once
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#include <winhttp.h>
#include <string>
#include <vector>

struct AuthSession {
    std::string token;
    std::string download_token;
    bool is_authenticated;
};

class VapeNetworkClient {
public:
    VapeNetworkClient();
    ~VapeNetworkClient();

    // Direct credentials login: POST /loader/login
    bool LoginWithCredentials(const std::string& username, const std::string& password, std::string& out_token);

    // Browser OAuth authentication: /api/v1/app-auth/generate and polling /status
    bool GenerateAppAuthSession(std::string& out_auth_url, std::string& out_session_id);
    bool PollAppAuthStatus(const std::string& session_id, std::string& out_token);

    // Payload download: /api/v1/client/request-payload and /api/v1/client/payload
    bool RequestPayload(const std::string& token, std::string& out_download_token);
    bool DownloadPayload(const std::string& download_token, std::vector<uint8_t>& out_payload_bytes);

    const std::wstring& GetLastError() const { return last_error_; }

private:
    HINTERNET h_session_;
    std::wstring last_error_;

    bool HttpPost(const std::wstring& host, INTERNET_PORT port, const std::wstring& path, const std::string& body, std::string& out_response);
    bool HttpGet(const std::wstring& host, INTERNET_PORT port, const std::wstring& path, const std::string& query, std::vector<uint8_t>& out_bytes);
};
