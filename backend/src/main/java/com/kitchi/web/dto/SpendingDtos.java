package com.kitchi.web.dto;

import com.kitchi.web.dto.GroceryDtos.TripResponse;
import com.kitchi.web.dto.MealDtos.MealResponse;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class SpendingDtos {
    private SpendingDtos() {}

    public enum BudgetStatus {
        NO_BUDGET,
        UNDER,
        NEAR,
        OVER
    }

    public record EatingOutResponse(
            UUID id,
            LocalDate entryDate,
            String place,
            BigDecimal amount,
            String note) {}

    public record EatingOutCreate(
            @NotNull LocalDate entryDate,
            @NotBlank @Size(max = 120) @Pattern(regexp = "^[^\\p{Cntrl}]+$") String place,
            @NotNull @DecimalMin("0.00") @DecimalMax("9999.99") BigDecimal amount,
            @Size(max = 500) String note) {}

    public record EatingOutPatch(
            LocalDate entryDate,
            @Size(min = 1, max = 120) @Pattern(regexp = "^[^\\p{Cntrl}]+$") String place,
            @DecimalMin("0.00") @DecimalMax("9999.99") BigDecimal amount,
            @Size(max = 500) String note) {}

    public record WeekRow(
            LocalDate weekStart,
            LocalDate weekEnd,
            boolean isCurrentWeek,
            BigDecimal groceryTotal,
            BigDecimal eatingOutTotal,
            long foodSavedCount,
            BigDecimal moneySaved,
            long wastedCount,
            BigDecimal wastedCost,
            BigDecimal eatingOutBudget,
            BudgetStatus budgetStatus) {}

    public record WeekDetail(
            LocalDate weekStart,
            LocalDate weekEnd,
            boolean isCurrentWeek,
            BigDecimal groceryTotal,
            BigDecimal eatingOutTotal,
            long foodSavedCount,
            BigDecimal moneySaved,
            long wastedCount,
            BigDecimal wastedCost,
            BigDecimal eatingOutBudget,
            BudgetStatus budgetStatus,
            List<TripResponse> trips,
            List<EatingOutResponse> eatingOut,
            List<MealResponse> meals) {}

    public record SavingsSummary(
            long foodItemsSaved,
            BigDecimal moneySaved,
            long mealsCooked,
            long wastedCount,
            BigDecimal wastedCost,
            WeekRow thisWeek,
            WeekRow lastWeek,
            int streakDays) {}
}
