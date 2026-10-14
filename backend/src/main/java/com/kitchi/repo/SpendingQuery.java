package com.kitchi.repo;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SpendingQuery {

    private static final String AGGREGATES = """
            grocery AS (
                SELECT date_trunc('week', trip_date::timestamp)::date AS week_start,
                       SUM(total) AS grocery_total
                FROM grocery_trips
                WHERE user_id = :userId
                GROUP BY 1
            ),
            eating AS (
                SELECT date_trunc('week', entry_date::timestamp)::date AS week_start,
                       SUM(amount) AS eating_out_total
                FROM eating_out_entries
                WHERE user_id = :userId
                GROUP BY 1
            ),
            cooked AS (
                SELECT date_trunc('week', (cooked_at AT TIME ZONE :zone))::date AS week_start,
                       SUM(money_saved) AS money_saved
                FROM meals
                WHERE user_id = :userId
                GROUP BY 1
            ),
            pantry AS (
                SELECT date_trunc('week', (status_changed_at AT TIME ZONE :zone))::date AS week_start,
                       COUNT(*) FILTER (WHERE status = 'USED') AS food_saved_count,
                       COUNT(*) FILTER (WHERE status = 'WASTED') AS wasted_count,
                       SUM(estimated_price) FILTER (WHERE status = 'WASTED') AS wasted_cost
                FROM ingredients
                WHERE user_id = :userId
                  AND status IN ('USED', 'WASTED')
                  AND status_changed_at IS NOT NULL
                GROUP BY 1
            )
            SELECT weeks.week_start,
                   (weeks.week_start + 6) AS week_end,
                   (weeks.week_start = ref.current_start) AS is_current_week,
                   COALESCE(grocery.grocery_total, 0)::numeric(12, 2) AS grocery_total,
                   COALESCE(eating.eating_out_total, 0)::numeric(12, 2) AS eating_out_total,
                   COALESCE(pantry.food_saved_count, 0)::bigint AS food_saved_count,
                   COALESCE(cooked.money_saved, 0)::numeric(12, 2) AS money_saved,
                   COALESCE(pantry.wasted_count, 0)::bigint AS wasted_count,
                   COALESCE(pantry.wasted_cost, 0)::numeric(12, 2) AS wasted_cost
            FROM weeks
            CROSS JOIN ref
            LEFT JOIN grocery ON grocery.week_start = weeks.week_start
            LEFT JOIN eating ON eating.week_start = weeks.week_start
            LEFT JOIN cooked ON cooked.week_start = weeks.week_start
            LEFT JOIN pantry ON pantry.week_start = weeks.week_start
            ORDER BY weeks.week_start DESC
            """;

    private static final String WEEKS_SQL = """
            WITH ref AS (
                SELECT date_trunc('week', (CAST(:asOf AS timestamptz) AT TIME ZONE :zone))::date AS current_start
            ),
            weeks AS (
                SELECT generate_series(
                    (SELECT current_start FROM ref)::timestamp
                        - (CAST(:count AS int) - 1) * INTERVAL '1 week',
                    (SELECT current_start FROM ref)::timestamp,
                    INTERVAL '1 week'
                )::date AS week_start
            ),
            """ + AGGREGATES;

    private static final String ONE_WEEK_SQL = """
            WITH ref AS (
                SELECT date_trunc('week', (CAST(:asOf AS timestamptz) AT TIME ZONE :zone))::date AS current_start
            ),
            weeks AS (
                SELECT CAST(:weekStart AS date) AS week_start
            ),
            """ + AGGREGATES;

    private static final String TOTALS_SQL = """
            SELECT
                (SELECT COUNT(*) FROM ingredients WHERE user_id = :userId AND status = 'USED') AS food_items_saved,
                (SELECT COALESCE(SUM(money_saved), 0) FROM meals WHERE user_id = :userId) AS money_saved,
                (SELECT COUNT(*) FROM meals WHERE user_id = :userId) AS meals_cooked,
                (SELECT COUNT(*) FROM ingredients WHERE user_id = :userId AND status = 'WASTED') AS wasted_count,
                (SELECT COALESCE(SUM(estimated_price), 0) FROM ingredients WHERE user_id = :userId AND status = 'WASTED') AS wasted_cost
            """;

    private static final String STREAK_SQL = """
            WITH today AS (
                SELECT (CAST(:asOf AS timestamptz) AT TIME ZONE :zone)::date AS day
            ),
            days AS (
                SELECT generate_series(
                    (SELECT day FROM today) - 400,
                    (SELECT day FROM today),
                    INTERVAL '1 day'
                )::date AS day
            ),
            marks AS (
                SELECT (status_changed_at AT TIME ZONE :zone)::date AS day,
                       bool_or(status = 'USED') AS has_used,
                       bool_or(status = 'WASTED') AS has_wasted
                FROM ingredients
                WHERE user_id = :userId
                  AND status IN ('USED', 'WASTED')
                  AND status_changed_at IS NOT NULL
                GROUP BY 1
            ),
            flags AS (
                SELECT days.day,
                       COALESCE(marks.has_used, false) AS has_used,
                       COALESCE(marks.has_wasted, false) AS has_wasted
                FROM days
                LEFT JOIN marks ON marks.day = days.day
            ),
            scored AS (
                SELECT (has_used AND NOT has_wasted) AS ok,
                       SUM(CASE WHEN has_used AND NOT has_wasted THEN 0 ELSE 1 END)
                           OVER (ORDER BY day DESC) AS breaks
                FROM flags
            )
            SELECT COUNT(*)::int AS streak_days
            FROM scored
            WHERE ok AND breaks = 0
            """;

    private final NamedParameterJdbcTemplate jdbc;

    public SpendingQuery(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<WeekNumbers> weeks(UUID userId, ZoneId zone, Instant asOf, int count) {
        MapSqlParameterSource params = base(userId, zone, asOf).addValue("count", count);
        return jdbc.query(WEEKS_SQL, params, (rs, row) -> mapWeek(rs));
    }

    public WeekNumbers week(UUID userId, ZoneId zone, Instant asOf, LocalDate weekStart) {
        MapSqlParameterSource params = base(userId, zone, asOf).addValue("weekStart", java.sql.Date.valueOf(weekStart));
        return jdbc.queryForObject(ONE_WEEK_SQL, params, (rs, row) -> mapWeek(rs));
    }

    public Totals totals(UUID userId) {
        return jdbc.queryForObject(TOTALS_SQL, new MapSqlParameterSource("userId", userId), (rs, row) -> new Totals(
                rs.getLong("food_items_saved"),
                money(rs.getBigDecimal("money_saved")),
                rs.getLong("meals_cooked"),
                rs.getLong("wasted_count"),
                money(rs.getBigDecimal("wasted_cost"))));
    }

    public int streak(UUID userId, ZoneId zone, Instant asOf) {
        Integer days = jdbc.queryForObject(STREAK_SQL, base(userId, zone, asOf), Integer.class);
        return days == null ? 0 : days;
    }

    private static MapSqlParameterSource base(UUID userId, ZoneId zone, Instant asOf) {
        return new MapSqlParameterSource()
                .addValue("userId", userId)
                .addValue("zone", zone.getId())
                .addValue("asOf", java.sql.Timestamp.from(asOf));
    }

    private static WeekNumbers mapWeek(ResultSet rs) throws SQLException {
        return new WeekNumbers(
                rs.getDate("week_start").toLocalDate(),
                rs.getDate("week_end").toLocalDate(),
                rs.getBoolean("is_current_week"),
                money(rs.getBigDecimal("grocery_total")),
                money(rs.getBigDecimal("eating_out_total")),
                rs.getLong("food_saved_count"),
                money(rs.getBigDecimal("money_saved")),
                rs.getLong("wasted_count"),
                money(rs.getBigDecimal("wasted_cost")));
    }

    private static BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    public record WeekNumbers(
            LocalDate weekStart,
            LocalDate weekEnd,
            boolean currentWeek,
            BigDecimal groceryTotal,
            BigDecimal eatingOutTotal,
            long foodSavedCount,
            BigDecimal moneySaved,
            long wastedCount,
            BigDecimal wastedCost) {}

    public record Totals(
            long foodItemsSaved,
            BigDecimal moneySaved,
            long mealsCooked,
            long wastedCount,
            BigDecimal wastedCost) {}
}
