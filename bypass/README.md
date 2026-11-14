# Vape V4 controller - key verification bypass

Patches `99b4747a.exe` (VapeV4ControllerRewrite) so its login/payload handshake
runs against a local relay that accepts any credentials.

## Run

```
run_vape.cmd
```

That starts `relay.py` on 127.0.0.1:8091 and launches `99b4747a_patched.exe`.
Start Minecraft afterwards.

## What the patcher changes

Two hardcoded defaults only, nothing else:

| file offset | what | before | after |
|---|---|---|---|
| `0x0EA958` | `VAPE_ONLINE_BASE_URL` default (UTF-16) | `http://online.vape.chat` | `http://127.0.0.1:8091` |
| `0x0EC2C0` | `VAPE_ZEUS_ADDRESS` default (ANSI) | `zeus-prod.vape.chat:8091` | `127.0.0.1:8091` |

The launcher's own login worker (`0x140009B8C`), payload fetch
(`0x14000ED60`) and injector are untouched. Its request bodies are unchanged:

```
POST /loader/login            {"username":..,"password":..,"hwid":..}
POST /api/v1/client/request-payload   token=<token>
POST /api/v1/client/payload           downloadToken=<token>
```

The relay answers `{"token":...}` / `{"downloadToken":...}` for any input, so
every check that depends on a valid account or HWID resolves to success.

## payload.bin

Real Vape 4.22 payload, dumped from the live manually-mapped image
(`Vape421Native.dll`, image base `0x180000000`, export `JNI_OnLoad`,
25,160,704 bytes). Its `.rsrc` embeds the Java payload jar, 25,096,879 bytes,
md5 `b52eb6d85362ec4967a46d63aa57a38f` - byte identical to the recovered
`vape-chat-15408.jar`. Replace with a newer build if one shows up.

## Verified

* original exe -> real `online.vape.chat:80` -> `403 account not found` -> exit
* patched exe -> relay: full chain, `login -> token -> request-payload ->
  downloadToken -> payload` completes, payload served and consumed
* relay returns the exact payload bytes (md5 `900fa8f6a8471beca2d3a03756854985`)
* the payload binary is the one currently mapped inside the running
  `java.exe` game process, so it is a working image

Not re-tested: a fresh injection into a new Minecraft instance, because that
would double-inject into the game session that is already running.

## Files

```
patch_exe.py            offline patcher (reproducible)
99b4747a_patched.exe    output
relay.py                local auth + payload server
payload.bin             real payload
run_vape.cmd            launcher
dump_payload.py         re-dumps the payload from a live process
relay.log               request log
```
