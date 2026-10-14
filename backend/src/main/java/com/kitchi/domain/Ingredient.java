package com.kitchi.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "ingredients")
public class Ingredient extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(nullable = false, length = 32)
    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private IngredientCategory category;

    @Column(nullable = false)
    private Instant addedAt;

    @Column(nullable = false)
    private LocalDate expiresAt;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal estimatedPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private IngredientStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private IngredientSource source;

    protected Ingredient() {}

    public Ingredient(
            UserAccount user,
            String name,
            BigDecimal quantity,
            String unit,
            IngredientCategory category,
            Instant addedAt,
            LocalDate expiresAt,
            BigDecimal estimatedPrice,
            IngredientSource source) {
        this.user = user;
        this.name = name.trim();
        this.quantity = quantity;
        this.unit = unit.trim();
        this.category = category;
        this.addedAt = addedAt;
        this.expiresAt = expiresAt;
        this.estimatedPrice = estimatedPrice;
        this.status = IngredientStatus.ACTIVE;
        this.source = source;
    }

    public UserAccount getUser() {
        return user;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name.trim();
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit.trim();
    }

    public IngredientCategory getCategory() {
        return category;
    }

    public void setCategory(IngredientCategory category) {
        this.category = category;
    }

    public Instant getAddedAt() {
        return addedAt;
    }

    public LocalDate getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDate expiresAt) {
        this.expiresAt = expiresAt;
    }

    public BigDecimal getEstimatedPrice() {
        return estimatedPrice;
    }

    public void setEstimatedPrice(BigDecimal estimatedPrice) {
        this.estimatedPrice = estimatedPrice;
    }

    public IngredientStatus getStatus() {
        return status;
    }

    public void setStatus(IngredientStatus status) {
        this.status = status;
    }

    public IngredientSource getSource() {
        return source;
    }
}
