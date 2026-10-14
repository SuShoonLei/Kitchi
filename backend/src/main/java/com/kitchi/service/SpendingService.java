package com.kitchi.service;

import com.kitchi.domain.UserAccount;
import com.kitchi.error.FieldException;
import com.kitchi.identity.CurrentUser;
import com.kitchi.identity.UserAccountService;
import com.kitchi.repo.SpendingQuery;
import com.kitchi.repo.SpendingQuery.Totals;
import com.kitchi.repo.SpendingQuery.WeekNumbers;
import com.kitchi.web.dto.SpendingDtos.BudgetStatus;
import com.kitchi.web.dto.SpendingDtos.SavingsSummary;
import com.kitchi.web.dto.SpendingDtos.WeekDetail;
import com.kitchi.web.dto.SpendingDtos.WeekRow;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SpendingService {

    private static final BigDecimal NEAR_RATIO = new BigDecimal("0.80");

    private final SpendingQuery query;
    private final UserAccountService users;
    private final MealService meals;
    private final GroceryService groceries;
    private final EatingOutService eatingOut;
    private final Clock clock;

    public SpendingService(
            SpendingQuery query,
            UserAccountService users,
            MealService meals,
            GroceryService groceries,
            EatingOutService eatingOut,
            Clock clock) {
        this.query = query;
        this.users = users;
        this.meals = meals;
        this.groceries = groceries;
        this.eatingOut = eatingOut;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<WeekRow> weeks(int count) {
        if (count < 1 || count > 52) {
            throw new FieldException("count", "Count must be from 1 to 52");
        }
        UserAccount user = users.requireAccount(CurrentUser.require());
        return query.weeks(user.getId(), CurrentUser.zone(), Instant.now(clock), count).stream()
                .map(row -> toRow(row, user.getEatingOutBudgetWeekly()))
                .toList();
    }

    @Transactional(readOnly = true)
    public WeekDetail week(LocalDate weekStart) {
        if (weekStart.getDayOfWeek() != DayOfWeek.MONDAY) {
            throw new FieldException("weekStart", "Week start must be a Monday");
        }
        UserAccount user = users.requireAccount(CurrentUser.require());
        ZoneId zone = CurrentUser.zone();
        WeekRow row = toRow(query.week(user.getId(), zone, Instant.now(clock), weekStart), user.getEatingOutBudgetWeekly());
        Instant start = weekStart.atStartOfDay(zone).toInstant();
        Instant end = weekStart.plusDays(7).atStartOfDay(zone).toInstant();
        return new WeekDetail(
                row.weekStart(),
                row.weekEnd(),
                row.isCurrentWeek(),
                row.groceryTotal(),
                row.eatingOutTotal(),
                row.foodSavedCount(),
                row.moneySaved(),
                row.wastedCount(),
                row.wastedCost(),
                row.eatingOutBudget(),
                row.budgetStatus(),
                groceries.trips(weekStart, weekStart.plusDays(6)),
                eatingOut.between(weekStart, weekStart.plusDays(6)),
                meals.cookedBetween(start, end));
    }

    @Transactional(readOnly = true)
    public SavingsSummary summary() {
        UserAccount user = users.requireAccount(CurrentUser.require());
        Totals totals = query.totals(user.getId());
        List<WeekRow> recent = weeks(2);
        return new SavingsSummary(
                totals.foodItemsSaved(),
                totals.moneySaved(),
                totals.mealsCooked(),
                totals.wastedCount(),
                totals.wastedCost(),
                recent.get(0),
                recent.get(1),
                query.streak(user.getId(), CurrentUser.zone(), Instant.now(clock)));
    }

    static BudgetStatus budgetStatus(BigDecimal spent, BigDecimal budget) {
        if (budget == null) {
            return BudgetStatus.NO_BUDGET;
        }
        if (spent.compareTo(budget) > 0) {
            return BudgetStatus.OVER;
        }
        if (budget.signum() == 0) {
            return BudgetStatus.NEAR;
        }
        if (spent.compareTo(budget.multiply(NEAR_RATIO)) < 0) {
            return BudgetStatus.UNDER;
        }
        return BudgetStatus.NEAR;
    }

    private static WeekRow toRow(WeekNumbers row, BigDecimal budget) {
        return new WeekRow(
                row.weekStart(),
                row.weekEnd(),
                row.currentWeek(),
                row.groceryTotal(),
                row.eatingOutTotal(),
                row.foodSavedCount(),
                row.moneySaved(),
                row.wastedCount(),
                row.wastedCost(),
                budget,
                budgetStatus(row.eatingOutTotal(), budget));
    }
}
