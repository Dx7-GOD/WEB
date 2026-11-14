@echo off
:: run_vape_streamer.cmd
:: Launches relay_streamer.py then VapeV4_Streamer_patched.exe
:: Start Minecraft AFTER this script.

setlocal
cd /d "%~dp0"

echo [*] Starting relay_streamer (HTTP:8091 + IPC:8092)...
start "VapeRelay" /B python relay_streamer.py

:: Give relay a moment to bind
timeout /t 1 /nobreak >nul

echo [*] Launching VapeV4_Streamer_patched.exe...
start "" VapeV4_Streamer_patched.exe

echo.
echo [+] Done. Open Minecraft now.
echo     - Streamer Mode is in the Utility tab of the ClickGUI
echo     - Bind a key to it; press once to enter, press again to exit
endlocal
