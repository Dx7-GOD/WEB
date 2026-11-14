// language: Java, file: Streamer.java
// package: gg.vape.module.utility
// Mirrors Panic.java structure — UtilityMod, same UI pattern.
//
// WHAT IT DOES WHEN ENABLED
// ─────────────────────────
// 1. Sets StreamerModeState.active = true
//    → every render hook that checks this flag skips drawing ESP, HUD, GUI.
// 2. Disables every currently-enabled module (saves the list for restore,
//    same logic as Panic's re-enable feature).
// 3. Closes the ClickGUI if it's open (Vape sends a close-gui event).
// 4. Sends "STREAMER_ON:<pid>" over the local IPC socket to the launcher.
//    → launcher calls SetWindowDisplayAffinity(mc_hwnd, WDA_EXCLUDEFROMCAPTURE)
//    → entire MC window becomes invisible to OBS / Discord / Game Bar / etc.
//
// WHAT IT DOES WHEN DISABLED (re-enabled)
// ─────────────────────────────────────────
// 1. Clears StreamerModeState.active = false  → renders resume.
// 2. Re-enables the previously-saved module list.
// 3. Sends "STREAMER_OFF:<pid>" to the launcher → WDA_NONE restored.
//
// REGISTRATION
// ─────────────
// In ModManager.init(), add after the Panic entry (index 36):
//
//   aload_2
//   bipush    37          // next free slot after Panic (adjust if needed)
//   new       #???        // class gg/vape/module/utility/Streamer
//   dup
//   invokespecial #???    // Method gg/vape/module/utility/Streamer."<init>":()V
//   aastore
//
// (bump the array size from 61 → 62 at the top of init())

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

public class Streamer extends UtilityMod {

    // ── option: restore mods when you toggle off ──────────────────────────────
    private final BooleanValue restoreMods = BooleanValue.create(
            this,
            "Restore Mods",
            true,
            "Re-enables all previously active modules when Streamer Mode is turned off"
    );

    // modules that were active before Streamer Mode engaged
    private final List<Mod> savedMods = new ArrayList<>();

    // IPC port — must match controller_port in main.cpp (8091)
    private static final int IPC_PORT = 8091;

    // ── constructor ───────────────────────────────────────────────────────────
    public Streamer() {
        super("Streamer", "Hides all hack UI and disables modules for screen sharing. "
                + "Makes the Minecraft window invisible to capture tools.");
        // hidden from arrayList until toggled — same pattern as Panic
        setDefaultVisibility(false);
        addValue(restoreMods);
    }

    // ── enable ────────────────────────────────────────────────────────────────
    @Override
    public void onEnable() {
        // 1. Immediately unset self (Streamer itself must not stay "enabled")
        setEnabled(false);

        // 2. Raise the flag — render hooks read this before drawing
        StreamerModeState.setActive(true);

        // 3. Snapshot enabled mods, then kill them all
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

        // 4. Close any open GUI (Vape's GuiScreen via reflection / known method)
        //    Vape routes through Minecraft.getMinecraft().displayGuiScreen(null)
        //    — call it via the wrapper layer the same way other modules do.
        try {
            Class<?> mc = Class.forName("gg.vape.wrapper.Wrapper");
            Object instance = mc.getMethod("getInstance").invoke(null);
            mc.getMethod("closeGui").invoke(instance);
        } catch (Exception ignored) {
            // no-op if the method name differs; GUI closes on next frame anyway
            // because StreamerModeState.isActive() suppresses all rendering
        }

        // 5. Tell the launcher to hide the window from capture
        sendIpc("STREAMER_ON:" + getMinecraftPid());
    }

    // ── disable / restore ─────────────────────────────────────────────────────
    //  Streamer Mode is itself a toggle: a second bind press = turn off.
    //  Since onEnable() sets enabled=false immediately, we hook onDisable()
    //  for the "off" path.  The UI should expose a keybind; pressing it once
    //  triggers onEnable (enter streamer mode), pressing it again when
    //  streamer mode is active triggers the restore flow below.
    //
    //  Practical flow: bind a key → first press calls onEnable() which
    //  clears the enabled flag and saves mods. Second press won't call
    //  onEnable() again because enabled is already false; instead the bind
    //  handler should detect StreamerModeState.isActive() and call
    //  exitStreamerMode() directly. Wire this in the event key handler
    //  (Mod.u(EventKeyPress)) after the standard toggle check:
    //
    //    if (StreamerModeState.isActive() && thisMod.getBind().matches(keyCode)) {
    //        thisMod.exitStreamerMode();
    //    }

    public void exitStreamerMode() {
        if (!StreamerModeState.isActive()) return;

        // 1. Clear render suppression
        StreamerModeState.setActive(false);

        // 2. Restore saved modules
        if (restoreMods.getEffectiveValue()) {
            for (Mod mod : savedMods) {
                mod.setEnabled(true);
            }
        }
        savedMods.clear();

        // 3. Tell launcher to restore window capture
        sendIpc("STREAMER_OFF:" + getMinecraftPid());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /** Sends a plain-text IPC message to the local controller socket. */
    private static void sendIpc(String message) {
        try (Socket sock = new Socket("127.0.0.1", IPC_PORT);
             OutputStream out = sock.getOutputStream()) {
            out.write((message + "\n").getBytes(StandardCharsets.UTF_8));
            out.flush();
        } catch (Exception e) {
            // launcher may not be running in some setups — silent fail
            // The Java-side render suppression still works without it
        }
    }

    /** PID of the current JVM process — this is the Minecraft process. */
    private static long getMinecraftPid() {
        return ProcessHandle.current().pid();
    }
}
