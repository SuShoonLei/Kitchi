package com.kitchi.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "meal_ingredients")
public class MealIngredient extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "meal_id", nullable = false)
    private Meal meal;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantityUsed;

    protected MealIngredient() {}

    public MealIngredient(UserAccount user, Meal meal, Ingredient ingredient, BigDecimal quantityUsed) {
        this.user = user;
        this.meal = meal;
        this.ingredient = ingredient;
        this.quantityUsed = quantityUsed;
    }

    public Ingredient getIngredient() {
        return ingredient;
    }

    public BigDecimal getQuantityUsed() {
        return quantityUsed;
    }

    public Meal getMeal() {
        return meal;
    }
}
