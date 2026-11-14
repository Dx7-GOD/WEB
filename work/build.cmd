@echo off
setlocal

set MSVC_ROOT=C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Tools\MSVC\14.51.36231
set WINSDK=C:\Program Files (x86)\Windows Kits\10
set SDKVER=10.0.26100.0

set CL="%MSVC_ROOT%\bin\Hostx64\x64\cl.exe"
set SRC=d:\vape\work\src\src
set OUT=d:\vape\bypass\VapeV4_Streamer.exe
set OBJ=d:\vape\work\obj

if not exist "%OBJ%" mkdir "%OBJ%"

:: Write a response file (avoids cmd quoting hell with spaces in paths)
set RSP=%OBJ%\build.rsp

(
echo /nologo /W2 /O2 /MT /std:c++17 /EHsc
echo /DWIN32_LEAN_AND_MEAN /D_WIN32_WINNT=0x0A00 /DWINVER=0x0A00
echo "/I%MSVC_ROOT%\include"
echo "/I%WINSDK%\Include\%SDKVER%\ucrt"
echo "/I%WINSDK%\Include\%SDKVER%\um"
echo "/I%WINSDK%\Include\%SDKVER%\shared"
echo /Fo"%OBJ%\\"
echo "%SRC%\main.cpp"
echo "%SRC%\injector.cpp"
echo "%SRC%\process_detector.cpp"
echo "%SRC%\network.cpp"
echo "%SRC%\streamer_mode.cpp"
echo "%SRC%\ipc_server.cpp"
echo /link
echo /SUBSYSTEM:WINDOWS
echo "/OUT:%OUT%"
echo "/LIBPATH:%MSVC_ROOT%\lib\x64"
echo "/LIBPATH:%WINSDK%\Lib\%SDKVER%\ucrt\x64"
echo "/LIBPATH:%WINSDK%\Lib\%SDKVER%\um\x64"
echo kernel32.lib user32.lib winhttp.lib ws2_32.lib psapi.lib advapi32.lib
) > "%RSP%"

echo [*] Compiling all sources...
%CL% @"%RSP%"

if %ERRORLEVEL% == 0 (
  echo.
  echo [+] SUCCESS: %OUT%
  for %%F in ("%OUT%") do echo [+] Size: %%~zF bytes
) else (
  echo [-] Build failed with errorlevel %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)
endlocal
