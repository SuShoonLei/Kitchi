package com.kitchi.identity;

import java.time.ZoneId;
import java.util.UUID;

public final class CurrentUser {

    private record Context(UUID userId, ZoneId zone) {}

    private static final ThreadLocal<Context> CURRENT = new ThreadLocal<>();

    private CurrentUser() {}

    public static void set(UUID userId, ZoneId zone) {
        CURRENT.set(new Context(userId, zone));
    }

    public static UUID require() {
        return context().userId();
    }

    public static ZoneId zone() {
        return context().zone();
    }

    public static void clear() {
        CURRENT.remove();
    }

    public static String shortId(UUID id) {
        String value = id.toString();
        return value.substring(0, 8);
    }

    private static Context context() {
        Context context = CURRENT.get();
        if (context == null) {
            throw new IllegalStateException("Missing device user");
        }
        return context;
    }
}
