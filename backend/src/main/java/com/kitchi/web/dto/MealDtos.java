package com.kitchi.web.dto;

import com.kitchi.domain.Cuisine;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class MealDtos {
    private MealDtos() {}

    public record CookLine(
            @NotNull UUID ingredientId,
            @NotNull @DecimalMin("0.001") BigDecimal quantityUsed) {}

    public record CookRequest(
            @NotBlank @Size(max = 160) @Pattern(regexp = "^[^\\p{Cntrl}]+$") String name,
            @NotNull Cuisine cuisine,
            @NotNull @Size(min = 1, max = 20) List<@Valid CookLine> ingredients) {}

    public record MealLine(UUID ingredientId, String name, BigDecimal quantityUsed, String unit) {}

    public record MealResponse(
            UUID id,
            String name,
            Cuisine cuisine,
            Instant cookedAt,
            BigDecimal moneySaved,
            List<MealLine> ingredients) {}
}
