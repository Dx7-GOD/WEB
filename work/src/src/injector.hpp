// language: C++, file: injector.hpp, target: Windows 11, MSVC
#pragma once
#include <windows.h>
#include <vector>
#include <string>
#include <cstdint>
#include "pe_loader.hpp"

enum class InjectionResult {
    Success = 0,
    FailedOpenProcess,
    FailedAllocatePayloadMemory,
    FailedWritePayload,
    FailedAllocateStubMemory,
    FailedWriteStubParameters,
    FailedWriteStubCode,
    FailedExecuteStub,
    StubTimedOut,
    StubReturnedFailure,
    BootstrapFailedSocket,
    BootstrapRejected
};

class VapeInjector {
public:
    VapeInjector();
    ~VapeInjector();

    // Map PE image into remote process, write import resolver stub, and execute DllMain
    InjectionResult InjectPayload(DWORD process_id, const std::vector<uint8_t>& raw_pe_bytes, uint16_t controller_port);

    const std::wstring& GetLastErrorString() const { return last_error_; }

private:
    std::wstring last_error_;

    bool MapImageSections(HANDLE h_process, const uint8_t* pe_data, size_t pe_size, void* remote_base);
    bool ApplyRelocations(HANDLE h_process, const uint8_t* pe_data, void* remote_base, uint64_t delta);
    bool PerformSocketHandshake(uint16_t port, uint32_t timeout_ms);
};
