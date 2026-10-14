package com.kitchi.web.dto;

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

public final class GroceryDtos {
    private GroceryDtos() {}

    public record GroceryItemResponse(
            UUID id,
            String name,
            BigDecimal quantity,
            String unit,
            boolean checked,
            BigDecimal estimatedPrice,
            String reason) {}

    public record GroceryItemCreate(
            @NotBlank @Size(max = 120) @Pattern(regexp = "^[^\\p{Cntrl}]+$") String name,
            @NotNull @DecimalMin("0.001") @DecimalMax("9999") BigDecimal quantity,
            @NotBlank @Size(max = 32) @Pattern(regexp = "^[^\\p{Cntrl}]+$") String unit,
            @NotNull @DecimalMin("0.00") @DecimalMax("9999.99") BigDecimal estimatedPrice,
            @Size(max = 200) String reason) {}

    public record GroceryItemPatch(
            @Size(min = 1, max = 120) @Pattern(regexp = "^[^\\p{Cntrl}]+$") String name,
            @DecimalMin("0.001") @DecimalMax("9999") BigDecimal quantity,
            @Size(min = 1, max = 32) @Pattern(regexp = "^[^\\p{Cntrl}]+$") String unit,
            Boolean checked,
            @DecimalMin("0.00") @DecimalMax("9999.99") BigDecimal estimatedPrice,
            @Size(max = 200) String reason) {}

    public record CheckoutRequest(
            @NotBlank @Size(max = 120) @Pattern(regexp = "^[^\\p{Cntrl}]+$") String store,
            LocalDate tripDate) {}

    public record TripItemResponse(UUID id, String name, BigDecimal quantity, BigDecimal price) {}

    public record TripResponse(
            UUID id,
            LocalDate tripDate,
            String store,
            BigDecimal total,
            List<TripItemResponse> items) {}
}
