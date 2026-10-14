package com.kitchi.web.dto;

import com.kitchi.domain.IngredientCategory;
import com.kitchi.domain.IngredientSource;
import com.kitchi.domain.IngredientStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class IngredientDtos {
    private IngredientDtos() {}

    public record IngredientResponse(
            UUID id,
            String name,
            BigDecimal quantity,
            String unit,
            IngredientCategory category,
            Instant addedAt,
            LocalDate expiresAt,
            BigDecimal estimatedPrice,
            IngredientStatus status,
            IngredientSource source) {}

    public record IngredientCreate(
            @NotBlank @Size(max = 120) @Pattern(regexp = "^[^\\p{Cntrl}]+$") String name,
            @NotNull @DecimalMin("0.001") @DecimalMax("9999") BigDecimal quantity,
            @NotBlank @Size(max = 32) @Pattern(regexp = "^[^\\p{Cntrl}]+$") String unit,
            @NotNull IngredientCategory category,
            @NotNull LocalDate expiresAt,
            @NotNull @DecimalMin("0.00") @DecimalMax("9999.99") BigDecimal estimatedPrice,
            IngredientSource source) {}

    public record IngredientBulk(@NotNull @Size(min = 1, max = 40) List<@Valid IngredientCreate> items) {}

    public record IngredientPatch(
            @Size(min = 1, max = 120) @Pattern(regexp = "^[^\\p{Cntrl}]+$") String name,
            @DecimalMin("0.001") @DecimalMax("9999") BigDecimal quantity,
            @Size(min = 1, max = 32) @Pattern(regexp = "^[^\\p{Cntrl}]+$") String unit,
            IngredientCategory category,
            LocalDate expiresAt,
            @DecimalMin("0.00") @DecimalMax("9999.99") BigDecimal estimatedPrice) {}
}
