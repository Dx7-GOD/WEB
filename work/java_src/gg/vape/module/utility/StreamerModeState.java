package gg.vape.module.utility;

/**
 * Shared flag: render hooks read this before drawing any hack overlay.
 * Written by Streamer.onEnable()/exitStreamerMode() on the MC thread,
 * read on the render thread — volatile for visibility.
 */
public final class StreamerModeState {

    private static volatile boolean active = false;

    private StreamerModeState() {}

    public static boolean isActive() {
        return active;
    }

    public static void setActive(boolean value) {
        active = value;
    }
}
