package com.kitchi.identity;

import com.kitchi.domain.UserAccount;
import com.kitchi.repo.UserAccountRepository;
import com.kitchi.seed.DevDataSeeder;
import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserAccountService {

    private static final ZoneId UTC = ZoneId.of("UTC");

    private final UserAccountRepository users;
    private final DevDataSeeder seeder;

    public UserAccountService(UserAccountRepository users, DevDataSeeder seeder) {
        this.users = users;
        this.seeder = seeder;
    }

    public record Resolved(UUID userId, ZoneId zone) {}

    @Transactional
    public Resolved resolve(UUID deviceId, String timezoneHeader) {
        boolean headerPresent = timezoneHeader != null && !timezoneHeader.isBlank();
        ZoneId requested = headerPresent ? parseOrUtc(timezoneHeader) : null;
        return users.findByDeviceId(deviceId)
                .map(user -> touch(user, requested, headerPresent))
                .orElseGet(() -> create(deviceId, requested == null ? UTC : requested));
    }

    private Resolved touch(UserAccount user, ZoneId requested, boolean headerPresent) {
        ZoneId zone = requested == null ? safe(user.getTimezone()) : requested;
        if (headerPresent && !zone.getId().equals(user.getTimezone())) {
            user.setTimezone(zone.getId());
        }
        return new Resolved(user.getId(), zone);
    }

    private Resolved create(UUID deviceId, ZoneId zone) {
        UserAccount user = new UserAccount(deviceId);
        user.setTimezone(zone.getId());
        user = users.save(user);
        seeder.seedIfEnabled(user);
        return new Resolved(user.getId(), zone);
    }

    @Transactional(readOnly = true)
    public UserAccount requireAccount(UUID userId) {
        return users.findById(userId).orElseThrow();
    }

    static ZoneId parseOrUtc(String raw) {
        try {
            ZoneId zone = ZoneId.of(raw.trim());
            String id = canonical(zone);
            if (id.length() > 64) {
                return UTC;
            }
            return ZoneId.of(id);
        } catch (DateTimeException exception) {
            return UTC;
        }
    }

    private static ZoneId safe(String stored) {
        try {
            return ZoneId.of(stored);
        } catch (DateTimeException exception) {
            return UTC;
        }
    }

    private static String canonical(ZoneId zone) {
        String id = zone.getId();
        if ("Z".equals(id) || "Etc/UTC".equals(id) || "Etc/GMT".equals(id) || "GMT".equals(id)) {
            return "UTC";
        }
        return id;
    }
}
