@echo off
rem Start the local auth/payload relay and the patched Vape controller.
setlocal
cd /d "%~dp0"

where py >nul 2>&1 && (set "PY=py -3") || (set "PY=python")

start "vape-relay" /min %PY% "%~dp0relay.py" 8091
for /l %%i in (1,1,40) do (
    %PY% -c "import socket,sys;s=socket.socket();s.settimeout(0.2);sys.exit(0 if s.connect_ex(('127.0.0.1',8091))==0 else 1)" >nul 2>&1 && goto ready
    >nul timeout /t 1 /nobreak
)
:ready
start "" "%~dp099b4747a_patched.exe"
endlocal
