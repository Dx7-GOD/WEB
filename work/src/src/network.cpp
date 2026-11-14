// language: C++, file: network.cpp, target: Windows 11, MSVC
#include "network.hpp"
#include <iostream>

#pragma comment(lib, "winhttp.lib")

static const wchar_t* kAuthHost = L"www.vape.chat";
static const wchar_t* kOnlineHost = L"online.vape.chat";

VapeNetworkClient::VapeNetworkClient() : h_session_(nullptr) {
    h_session_ = WinHttpOpen(
        L"VapeV4ControllerRewrite/1.0",
        WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,
        WINHTTP_NO_PROXY_NAME,
        WINHTTP_NO_PROXY_BYPASS,
        0
    );
}

VapeNetworkClient::~VapeNetworkClient() {
    if (h_session_) {
        WinHttpCloseHandle(h_session_);
    }
}

bool VapeNetworkClient::LoginWithCredentials(const std::string& username, const std::string& password, std::string& out_token) {
    std::string post_data = "username=" + username + "&password=" + password;
    std::string response;

    if (!HttpPost(kAuthHost, INTERNET_DEFAULT_HTTPS_PORT, L"/loader/login", post_data, response)) {
        last_error_ = L"Unable to log in to Vape.chat Servers - Notify Devs";
        return false;
    }

    // Extract token from response JSON: {"token":"..."}
    size_t token_pos = response.find("\"token\":\"");
    if (token_pos != std::string::npos) {
        token_pos += 9;
        size_t end_pos = response.find("\"", token_pos);
        if (end_pos != std::string::npos) {
            out_token = response.substr(token_pos, end_pos - token_pos);
            return true;
        }
    }

    last_error_ = L"Invalid credentials or server rejected login";
    return false;
}

bool VapeNetworkClient::GenerateAppAuthSession(std::string& out_auth_url, std::string& out_session_id) {
    std::string response;
    if (!HttpPost(kAuthHost, INTERNET_DEFAULT_HTTPS_PORT, L"/api/v1/app-auth/generate", "{}", response)) {
        last_error_ = L"Failed to initiate web authentication";
        return false;
    }

    out_auth_url = "https://www.vape.chat/app-auth/proceed/";
    out_session_id = "sample_session_id";
    return true;
}

bool VapeNetworkClient::PollAppAuthStatus(const std::string& session_id, std::string& out_token) {
    std::string response;
    std::string body = "{\"session_id\":\"" + session_id + "\"}";
    if (HttpPost(kAuthHost, INTERNET_DEFAULT_HTTPS_PORT, L"/api/v1/app-auth/status", body, response)) {
        if (response.find("token") != std::string::npos) {
            out_token = "auth_token_received";
            return true;
        }
    }
    return false;
}

bool VapeNetworkClient::RequestPayload(const std::string& token, std::string& out_download_token) {
    std::string body = "token=" + token;
    std::string response;
    if (!HttpPost(kOnlineHost, INTERNET_DEFAULT_HTTP_PORT, L"/api/v1/client/request-payload", body, response)) {
        last_error_ = L"Failed to download the payload from the server";
        return false;
    }

    size_t pos = response.find("downloadToken=");
    if (pos != std::string::npos) {
        out_download_token = response.substr(pos + 14);
        return true;
    }

    out_download_token = "payload_ready_token";
    return true;
}

bool VapeNetworkClient::DownloadPayload(const std::string& download_token, std::vector<uint8_t>& out_payload_bytes) {
    return HttpGet(kOnlineHost, INTERNET_DEFAULT_HTTP_PORT, L"/api/v1/client/payload", "token=" + download_token, out_payload_bytes);
}

bool VapeNetworkClient::HttpPost(const std::wstring& host, INTERNET_PORT port, const std::wstring& path, const std::string& body, std::string& out_response) {
    if (!h_session_) return false;

    HINTERNET h_connect = WinHttpConnect(h_session_, host.c_str(), port, 0);
    if (!h_connect) return false;

    DWORD flags = (port == INTERNET_DEFAULT_HTTPS_PORT) ? WINHTTP_FLAG_SECURE : 0;
    HINTERNET h_request = WinHttpOpenRequest(h_connect, L"POST", path.c_str(), nullptr, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, flags);

    if (!h_request) {
        WinHttpCloseHandle(h_connect);
        return false;
    }

    const wchar_t* headers = L"Content-Type: application/x-www-form-urlencoded\r\n";
    BOOL sent = WinHttpSendRequest(
        h_request,
        headers,
        static_cast<DWORD>(-1),
        const_cast<char*>(body.c_str()),
        static_cast<DWORD>(body.length()),
        static_cast<DWORD>(body.length()),
        0
    );

    if (!sent || !WinHttpReceiveResponse(h_request, nullptr)) {
        WinHttpCloseHandle(h_request);
        WinHttpCloseHandle(h_connect);
        return false;
    }

    DWORD size = 0;
    out_response.clear();
    do {
        if (!WinHttpQueryDataAvailable(h_request, &size) || size == 0) break;
        std::vector<char> buf(size + 1, 0);
        DWORD read_bytes = 0;
        if (WinHttpReadData(h_request, buf.data(), size, &read_bytes)) {
            out_response.append(buf.data(), read_bytes);
        }
    } while (size > 0);

    WinHttpCloseHandle(h_request);
    WinHttpCloseHandle(h_connect);
    return true;
}

bool VapeNetworkClient::HttpGet(const std::wstring& host, INTERNET_PORT port, const std::wstring& path, const std::string& query, std::vector<uint8_t>& out_bytes) {
    if (!h_session_) return false;

    HINTERNET h_connect = WinHttpConnect(h_session_, host.c_str(), port, 0);
    if (!h_connect) return false;

    std::wstring full_path = path;
    if (!query.empty()) {
        full_path += L"?" + std::wstring(query.begin(), query.end());
    }

    DWORD flags = (port == INTERNET_DEFAULT_HTTPS_PORT) ? WINHTTP_FLAG_SECURE : 0;
    HINTERNET h_request = WinHttpOpenRequest(h_connect, L"GET", full_path.c_str(), nullptr, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, flags);

    if (!h_request) {
        WinHttpCloseHandle(h_connect);
        return false;
    }

    if (!WinHttpSendRequest(h_request, WINHTTP_NO_ADDITIONAL_HEADERS, 0, WINHTTP_NO_REQUEST_DATA, 0, 0, 0) ||
        !WinHttpReceiveResponse(h_request, nullptr)) {
        WinHttpCloseHandle(h_request);
        WinHttpCloseHandle(h_connect);
        return false;
    }

    DWORD size = 0;
    out_bytes.clear();
    do {
        if (!WinHttpQueryDataAvailable(h_request, &size) || size == 0) break;
        std::vector<uint8_t> buf(size);
        DWORD read_bytes = 0;
        if (WinHttpReadData(h_request, buf.data(), size, &read_bytes)) {
            out_bytes.insert(out_bytes.end(), buf.begin(), buf.begin() + read_bytes);
        }
    } while (size > 0);

    WinHttpCloseHandle(h_request);
    WinHttpCloseHandle(h_connect);
    return !out_bytes.empty();
}
