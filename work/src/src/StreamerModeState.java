// language: Java, file: StreamerModeState.java
// package: gg.vape.module.utility
// Static singleton flag — read by render/HUD hooks to suppress drawing when
// Streamer Mode is active.  Zero dependencies: safe to call from any thread.

package gg.vape.module.utility;

public final class StreamerModeState {

    // volatile: written by the Streamer module (Minecraft thread),
    // read by render hooks (render thread).
    private static volatile boolean active = false;

    private StreamerModeState() {}

    public static boolean isActive() {
        return active;
    }

    /** Called by Streamer.onEnable() */
    static void setActive(boolean value) {
        active = value;
    }
}
