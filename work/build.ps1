$MSVC   = "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Tools\MSVC\14.51.36231"
$WINSDK = "C:\Program Files (x86)\Windows Kits\10"
$SDKVER = "10.0.26100.0"
$CL     = "$MSVC\bin\Hostx64\x64\cl.exe"
$LINK   = "$MSVC\bin\Hostx64\x64\link.exe"
$SRC    = "d:\vape\work\src\src"
$OBJ    = "d:\vape\work\obj"
$OUT    = "d:\vape\bypass\VapeV4_Streamer.exe"

New-Item -Force -ItemType Directory $OBJ | Out-Null

$inc = @(
    "/I$MSVC\include",
    "/I$WINSDK\Include\$SDKVER\ucrt",
    "/I$WINSDK\Include\$SDKVER\um",
    "/I$WINSDK\Include\$SDKVER\shared"
)

$defs = @("/DWIN32_LEAN_AND_MEAN", "/D_WIN32_WINNT=0x0A00", "/DWINVER=0x0A00")

$srcs = @(
    "$SRC\main.cpp",
    "$SRC\injector.cpp",
    "$SRC\process_detector.cpp",
    "$SRC\network.cpp",
    "$SRC\streamer_mode.cpp",
    "$SRC\ipc_server.cpp"
)

$libs = @(
    "kernel32.lib", "user32.lib", "winhttp.lib",
    "ws2_32.lib", "psapi.lib", "advapi32.lib"
)

$libpaths = @(
    "/LIBPATH:$MSVC\lib\x64",
    "/LIBPATH:$WINSDK\Lib\$SDKVER\ucrt\x64",
    "/LIBPATH:$WINSDK\Lib\$SDKVER\um\x64"
)

Write-Host "[*] Compiling..."

$cl_args = @(
    "/nologo", "/W2", "/O2", "/MT", "/std:c++17", "/EHsc",
    "/Fo$OBJ\\"
) + $inc + $defs + $srcs + @("/c")

& $CL @cl_args
if ($LASTEXITCODE -ne 0) { Write-Host "[-] Compile failed"; exit 1 }

Write-Host "[*] Linking..."
$objs = Get-ChildItem $OBJ -Filter "*.obj" | ForEach-Object { $_.FullName }

$link_args = @(
    "/nologo", "/SUBSYSTEM:WINDOWS", "/OUT:$OUT"
) + $libpaths + $objs + $libs

& $LINK @link_args
if ($LASTEXITCODE -ne 0) { Write-Host "[-] Link failed"; exit 1 }

$sz = (Get-Item $OUT).Length
Write-Host "[+] SUCCESS: $OUT ($sz bytes)"
