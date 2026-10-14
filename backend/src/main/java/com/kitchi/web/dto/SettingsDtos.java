package com.kitchi.web.dto;

import com.kitchi.domain.Cuisine;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public final class SettingsDtos {
    private SettingsDtos() {}

    public record SettingsResponse(List<Cuisine> cuisines, String currency, BigDecimal eatingOutBudgetWeekly) {}

    public record SettingsUpdate(
            @NotNull @Size(max = 11) List<Cuisine> cuisines,
            @NotNull @Pattern(regexp = "^[A-Za-z]{3}$", message = "Use a 3-letter currency code") String currency,
            @DecimalMin(value = "0.00", message = "Budget must be zero or more")
            @DecimalMax(value = "9999.99", message = "Budget is too large")
            @Digits(integer = 4, fraction = 2, message = "Use at most 2 decimal places")
            BigDecimal eatingOutBudgetWeekly) {}
}
