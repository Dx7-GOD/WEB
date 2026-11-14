package gg.vape.module.utility;

import gg.vape.Vape;
import gg.vape.module.Mod;
import gg.vape.module.UtilityMod;
import gg.vape.value.BooleanValue;

import java.io.OutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Streamer Mode — Utility category, same UI/UX pattern as Panic.
 *
 * ON ENABLE (bind pressed, streamer mode is currently OFF):
 *   1. StreamerModeState.active = true  → all render hooks go dark
 *   2. Disables every enabled module (optionally saves them for restore)
 *   3. Sends "STREAMER_ON:<pid>" to the launcher (port 8092) which calls
 *      SetWindowDisplayAffinity(mc_hwnd, WDA_EXCLUDEFROMCAPTURE) —
 *      the entire MC window disappears from OBS/Discord/Game Bar capture.
 *   4. Clears self (enabled = false) so it stays a momentary-trigger like Panic.
 *
 * SECOND BIND PRESS (while streamer mode is ON):
 *   exitStreamerMode() — reverses everything.
 *
 * REGISTRATION in ModManager.init():
 *   Bump Mod[] array size 61 → 62, insert after Panic at index 36:
 *     new gg.vape.module.utility.Streamer()
 */
public class Streamer extends UtilityMod {

    // ── option ────────────────────────────────────────────────────────────────
    private final BooleanValue restoreMods = BooleanValue.create(
            this,
            "Restore Mods",
            true,
            "Re-enables previously active modules when Streamer Mode is turned off"
    );

    private final List<Mod> savedMods = new ArrayList<>();

    // Launcher IPC port (separate from relay port 8091 to avoid collision)
    private static final int IPC_PORT = 8092;

    // ── constructor ───────────────────────────────────────────────────────────
    public Streamer() {
        super("Streamer",
              "Hides all hack UI and disables modules while screen sharing. "
            + "Makes Minecraft invisible to screen capture tools (OBS, Discord, Game Bar).");
        setDefaultVisibility(false);  // hidden in arraylist, visible in clickgui
        addValue(restoreMods);
    }

    // ── enable — enter streamer mode ──────────────────────────────────────────
    @Override
    public void onEnable() {
        // If already in streamer mode: second press = exit
        if (StreamerModeState.isActive()) {
            setEnabled(false);
            exitStreamerMode();
            return;
        }

        // 1. Raise the render-suppression flag
        StreamerModeState.setActive(true);

        // 2. Disable all currently enabled mods (save for restore)
        savedMods.clear();
        Collection<Mod> all = Vape.INSTANCE.getModManager().collectMods();
        for (Mod mod : all) {
            if (mod == this) continue;
            if (mod.isEnabled()) {
                if (restoreMods.getEffectiveValue()) {
                    savedMods.add(mod);
                }
                mod.setEnabled(false);
            }
        }

        // 3. Tell the launcher to hide MC from screen capture
        sendIpc("STREAMER_ON:" + getPid());

        // 4. Reset self so it stays a momentary trigger (Panic pattern)
        setEnabled(false);
    }

    // ── exit streamer mode ────────────────────────────────────────────────────
    public void exitStreamerMode() {
        // 1. Clear render suppression — overlays resume next frame
        StreamerModeState.setActive(false);

        // 2. Restore saved mods
        if (restoreMods.getEffectiveValue()) {
            for (Mod mod : savedMods) {
                try {
                    mod.setEnabled(true);
                } catch (Exception ignored) {}
            }
        }
        savedMods.clear();

        // 3. Tell launcher to restore window capture visibility
        sendIpc("STREAMER_OFF:" + getPid());
    }

    // ── IPC helper ────────────────────────────────────────────────────────────
    private static long getPid() {
        // Compatible with Java 8+ (Runtime.exec based fallback)
        // On Java 9+ ProcessHandle is available, but payload targets Java 8 compat
        try {
            // java.lang.management.ManagementFactory available since Java 5
            String name = java.lang.management.ManagementFactory.getRuntimeMXBean().getName();
            // format: "<pid>@<hostname>"
            return Long.parseLong(name.split("@")[0]);
        } catch (Exception e) {
            return 0L;
        }
    }

    private static void sendIpc(String message) {
        try (Socket sock = new Socket("127.0.0.1", IPC_PORT);
             OutputStream out = sock.getOutputStream()) {
            out.write((message + "\n").getBytes(StandardCharsets.UTF_8));
            out.flush();
        } catch (Exception ignored) {
            // Launcher may not be running in some setups.
            // Render suppression + module disabling still work without it.
        }
    }
}
