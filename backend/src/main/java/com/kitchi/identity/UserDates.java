package com.kitchi.identity;

import java.time.Clock;
import java.time.LocalDate;

public final class UserDates {

    private UserDates() {}

    public static LocalDate today(Clock clock) {
        return LocalDate.now(clock.withZone(CurrentUser.zone()));
    }
}
