package com.kitchi;

import static org.hamcrest.Matchers.hasItem;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SpendingApiTest {

    private static final ZoneId NEW_YORK = ZoneId.of("America/New_York");
    /** Sunday 11:30pm EDT, which is already Monday in UTC. */
    private static final Instant SUNDAY_LATE = Instant.parse("2026-10-12T03:30:00Z");
    /** Monday 12:00am EDT, the first instant of the new week. */
    private static final Instant MONDAY_START = Instant.parse("2026-10-12T04:00:00Z");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        PostgresTestDatabase.register(registry);
    }

    private static final Instant AS_OF = Instant.parse("2026-10-14T15:00:00Z");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    @MockitoBean
    private Clock clock;

    @BeforeEach
    void freezeClock() {
        when(clock.instant()).thenReturn(AS_OF);
        when(clock.getZone()).thenReturn(ZoneOffset.UTC);
        when(clock.withZone(any())).thenAnswer(invocation -> Clock.fixed(AS_OF, invocation.getArgument(0)));
    }

    @Test
    void weeklySqlKeepsWeeksTimezoneTotalsBudgetAndUsersApart() throws Exception {
        String device = UUID.randomUUID().toString();
        api(get("/api/v1/settings"), device).andExpect(status().isOk());
        UUID userId = userId(device);
        assertEquals("America/New_York", timezone(device));

        trip(userId, LocalDate.of(2026, 10, 13), "Green Market", "10.00");
        trip(userId, LocalDate.of(2026, 10, 14), "Corner Grocer", "5.50");
        eating(userId, LocalDate.of(2026, 10, 14), "Little Rangoon", "40.00");
        eating(userId, LocalDate.of(2026, 10, 14), "Market stall lunch", "39.00");
        eating(userId, LocalDate.of(2026, 10, 6), "Basil & Chili", "80.00");
        eating(userId, LocalDate.of(2026, 9, 28), "Sunday Noodle Bar", "100.00");
        eating(userId, LocalDate.of(2026, 9, 27), "Corner counter", "101.00");
        meal(userId, "Sunday soup", SUNDAY_LATE, "3.00");
        meal(userId, "Monday rice", MONDAY_START, "4.00");
        ingredient(userId, "Sunday cilantro", "USED", SUNDAY_LATE, "1.00");
        ingredient(userId, "Monday tofu", "USED", MONDAY_START, "2.00");
        ingredient(userId, "Tuesday spinach", "USED", at(2026, 10, 13, 12), "1.00");
        ingredient(userId, "Wednesday milk", "USED", at(2026, 10, 14, 12), "1.00");
        ingredient(userId, "Monday yogurt", "WASTED", at(2026, 10, 12, 12), "2.50");

        api(get("/api/v1/spending/weeks").param("count", "8"), device)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(8))
                .andExpect(jsonPath("$[0].weekStart").value("2026-10-12"))
                .andExpect(jsonPath("$[0].weekEnd").value("2026-10-18"))
                .andExpect(jsonPath("$[0].isCurrentWeek").value(true))
                .andExpect(jsonPath("$[0].groceryTotal").value(15.50))
                .andExpect(jsonPath("$[0].eatingOutTotal").value(79.00))
                .andExpect(jsonPath("$[0].moneySaved").value(4.00))
                .andExpect(jsonPath("$[0].foodSavedCount").value(3))
                .andExpect(jsonPath("$[0].wastedCount").value(1))
                .andExpect(jsonPath("$[0].wastedCost").value(2.50))
                .andExpect(jsonPath("$[0].budgetStatus").value("NO_BUDGET"))
                .andExpect(jsonPath("$[1].weekStart").value("2026-10-05"))
                .andExpect(jsonPath("$[1].eatingOutTotal").value(80.00))
                .andExpect(jsonPath("$[1].moneySaved").value(3.00))
                .andExpect(jsonPath("$[1].foodSavedCount").value(1))
                .andExpect(jsonPath("$[2].eatingOutTotal").value(100.00))
                .andExpect(jsonPath("$[3].weekStart").value("2026-09-21"))
                .andExpect(jsonPath("$[3].eatingOutTotal").value(101.00))
                .andExpect(jsonPath("$[4].weekStart").value("2026-09-14"))
                .andExpect(jsonPath("$[4].groceryTotal").value(0))
                .andExpect(jsonPath("$[4].eatingOutTotal").value(0))
                .andExpect(jsonPath("$[4].foodSavedCount").value(0))
                .andExpect(jsonPath("$[4].moneySaved").value(0))
                .andExpect(jsonPath("$[4].isCurrentWeek").value(false));

        api(put("/api/v1/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"cuisines":["Vietnamese","Mediterranean"],"currency":"usd","eatingOutBudgetWeekly":100.00}
                                """),
                device)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currency").value("USD"))
                .andExpect(jsonPath("$.eatingOutBudgetWeekly").value(100.00))
                .andExpect(jsonPath("$.cuisines", hasItem("Vietnamese")))
                .andExpect(jsonPath("$.cuisines", hasItem("Mediterranean")));

        api(get("/api/v1/spending/weeks").param("count", "8"), device)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].eatingOutBudget").value(100.00))
                .andExpect(jsonPath("$[0].budgetStatus").value("UNDER"))
                .andExpect(jsonPath("$[1].budgetStatus").value("NEAR"))
                .andExpect(jsonPath("$[2].budgetStatus").value("NEAR"))
                .andExpect(jsonPath("$[3].budgetStatus").value("OVER"))
                .andExpect(jsonPath("$[4].budgetStatus").value("UNDER"));

        api(get("/api/v1/spending/weeks/2026-10-12"), device)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groceryTotal").value(15.50))
                .andExpect(jsonPath("$.moneySaved").value(4.00))
                .andExpect(jsonPath("$.trips.length()").value(2))
                .andExpect(jsonPath("$.trips[0].items.length()").value(2))
                .andExpect(jsonPath("$.trips[1].items.length()").value(2))
                .andExpect(jsonPath("$.eatingOut.length()").value(2))
                .andExpect(jsonPath("$.meals.length()").value(1))
                .andExpect(jsonPath("$.meals[0].moneySaved").value(4.00));

        api(get("/api/v1/spending/weeks/2026-10-05"), device)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.moneySaved").value(3.00))
                .andExpect(jsonPath("$.eatingOutTotal").value(80.00))
                .andExpect(jsonPath("$.meals.length()").value(1))
                .andExpect(jsonPath("$.meals[0].moneySaved").value(3.00));

        api(get("/api/v1/spending/weeks/2026-10-11"), device)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.weekStart").value("Week start must be a Monday"));

        api(get("/api/v1/savings/summary"), device)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.foodItemsSaved").value(4))
                .andExpect(jsonPath("$.moneySaved").value(7.00))
                .andExpect(jsonPath("$.mealsCooked").value(2))
                .andExpect(jsonPath("$.wastedCount").value(1))
                .andExpect(jsonPath("$.wastedCost").value(2.50))
                .andExpect(jsonPath("$.streakDays").value(2))
                .andExpect(jsonPath("$.thisWeek.groceryTotal").value(15.50))
                .andExpect(jsonPath("$.lastWeek.moneySaved").value(3.00));

        String other = UUID.randomUUID().toString();
        api(get("/api/v1/settings"), other).andExpect(status().isOk());
        UUID otherId = userId(other);
        trip(otherId, LocalDate.of(2026, 10, 14), "Harbor Produce", "999.00");
        ingredient(otherId, "Other milk", "USED", at(2026, 10, 14, 12), "8.00");
        meal(otherId, "Other soup", MONDAY_START, "50.00");

        api(get("/api/v1/spending/weeks").param("count", "1"), device)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].groceryTotal").value(15.50))
                .andExpect(jsonPath("$[0].foodSavedCount").value(3))
                .andExpect(jsonPath("$[0].moneySaved").value(4.00));

        api(get("/api/v1/spending/weeks").param("count", "1"), other)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].groceryTotal").value(999.00))
                .andExpect(jsonPath("$[0].foodSavedCount").value(1))
                .andExpect(jsonPath("$[0].moneySaved").value(50.00))
                .andExpect(jsonPath("$[0].eatingOutTotal").value(0));
    }

    @Test
    void rejectsUnknownCuisineAndInvalidBudget() throws Exception {
        String device = UUID.randomUUID().toString();
        api(put("/api/v1/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"cuisines":["Martian"],"currency":"USD"}
                                """),
                device)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors['cuisines[0]']").value("Unknown cuisine"));

        api(put("/api/v1/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"cuisines":["Thai"],"currency":"USD","eatingOutBudgetWeekly":12.345}
                                """),
                device)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.eatingOutBudgetWeekly").value("Use at most 2 decimal places"));

        api(put("/api/v1/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"cuisines":["Thai"],"currency":"US"}
                                """),
                device)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.currency").value("Use a 3-letter currency code"));
    }

    @Test
    void invalidTimezoneHeaderIsStoredAsUtc() throws Exception {
        String device = UUID.randomUUID().toString();
        mockMvc.perform(get("/api/v1/settings").header("X-Device-Id", device).header("X-Timezone", "Not/AZone"))
                .andExpect(status().isOk());
        assertEquals("UTC", timezone(device));
    }

    @Test
    void invalidTimezoneHeaderKeepsTheStoredZone() throws Exception {
        String device = UUID.randomUUID().toString();
        api(get("/api/v1/settings"), device).andExpect(status().isOk());
        assertEquals("America/New_York", timezone(device));

        mockMvc.perform(get("/api/v1/settings").header("X-Device-Id", device).header("X-Timezone", "Not/AZone"))
                .andExpect(status().isOk());
        assertEquals("America/New_York", timezone(device));
    }

    @Test
    void renamingAUsedItemDoesNotMoveItsWeek() throws Exception {
        String device = UUID.randomUUID().toString();
        api(get("/api/v1/settings"), device).andExpect(status().isOk());
        UUID owner = userId(device);
        UUID ingredientId = UUID.randomUUID();
        Instant old = at(2026, 9, 28, 12);
        jdbc.update(
                """
                insert into ingredients (
                    id, user_id, name, quantity, unit, category, added_at, expires_at,
                    estimated_price, status, source, status_changed_at, created_at, updated_at)
                values (?, ?, 'Old rice', 1, 'count', 'grain', ?, '2026-11-01', 3.00, 'USED', 'MANUAL', ?, ?, ?)
                """,
                ingredientId,
                owner,
                Timestamp.from(old),
                Timestamp.from(old),
                Timestamp.from(old),
                Timestamp.from(old));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/ingredients/" + ingredientId)
                        .header("X-Device-Id", device)
                        .header("X-Timezone", "America/New_York")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Renamed rice\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed rice"));

        api(get("/api/v1/spending/weeks").param("count", "8"), device)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[2].weekStart").value("2026-09-28"))
                .andExpect(jsonPath("$[2].foodSavedCount").value(1))
                .andExpect(jsonPath("$[0].weekStart").value("2026-10-12"))
                .andExpect(jsonPath("$[0].foodSavedCount").value(0));
    }

    private org.springframework.test.web.servlet.ResultActions api(MockHttpServletRequestBuilder request, String device)
            throws Exception {
        return mockMvc.perform(request.header("X-Device-Id", device).header("X-Timezone", "America/New_York"));
    }

    private UUID userId(String device) {
        return jdbc.queryForObject("select id from users where device_id = ?", UUID.class, UUID.fromString(device));
    }

    private String timezone(String device) {
        return jdbc.queryForObject(
                "select timezone from users where device_id = ?", String.class, UUID.fromString(device));
    }

    private void trip(UUID userId, LocalDate date, String store, String total) {
        UUID tripId = UUID.randomUUID();
        jdbc.update(
                """
                insert into grocery_trips (id, user_id, trip_date, store, total, created_at, updated_at)
                values (?, ?, ?, ?, ?, now(), now())
                """,
                tripId,
                userId,
                Date.valueOf(date),
                store,
                new BigDecimal(total));
        item(userId, tripId, "Bag one");
        item(userId, tripId, "Bag two");
    }

    private void item(UUID userId, UUID tripId, String name) {
        jdbc.update(
                """
                insert into grocery_trip_items (id, user_id, trip_id, name, quantity, price, created_at, updated_at)
                values (?, ?, ?, ?, 1, 1.00, now(), now())
                """,
                UUID.randomUUID(),
                userId,
                tripId,
                name);
    }

    private void eating(UUID userId, LocalDate date, String place, String amount) {
        jdbc.update(
                """
                insert into eating_out_entries (id, user_id, entry_date, place, amount, created_at, updated_at)
                values (?, ?, ?, ?, ?, now(), now())
                """,
                UUID.randomUUID(),
                userId,
                Date.valueOf(date),
                place,
                new BigDecimal(amount));
    }

    private void meal(UUID userId, String name, Instant cookedAt, String saved) {
        jdbc.update(
                """
                insert into meals (id, user_id, name, cuisine, cooked_at, money_saved, created_at, updated_at)
                values (?, ?, ?, 'THAI', ?, ?, now(), now())
                """,
                UUID.randomUUID(),
                userId,
                name,
                Timestamp.from(cookedAt),
                new BigDecimal(saved));
    }

    private void ingredient(UUID userId, String name, String status, Instant when, String price) {
        jdbc.update(
                """
                insert into ingredients (
                    id, user_id, name, quantity, unit, category, added_at, expires_at,
                    estimated_price, status, source, status_changed_at, created_at, updated_at)
                values (?, ?, ?, 1, 'count', 'produce', ?, '2026-11-01', ?, ?, 'MANUAL', ?, ?, ?)
                """,
                UUID.randomUUID(),
                userId,
                name,
                Timestamp.from(when),
                new BigDecimal(price),
                status,
                Timestamp.from(when),
                Timestamp.from(when),
                Timestamp.from(when));
    }

    private static Instant at(int year, int month, int day, int hour) {
        return ZonedDateTime.of(year, month, day, hour, 0, 0, 0, NEW_YORK).toInstant();
    }
}
