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

@Entity
@Table(name = "meals")
public class Meal extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(nullable = false, length = 160)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Cuisine cuisine;

    @Column(nullable = false)
    private Instant cookedAt;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal moneySaved;

    protected Meal() {}

    public Meal(UserAccount user, String name, Cuisine cuisine, Instant cookedAt, BigDecimal moneySaved) {
        this.user = user;
        this.name = name.trim();
        this.cuisine = cuisine;
        this.cookedAt = cookedAt;
        this.moneySaved = moneySaved;
    }

    public String getName() {
        return name;
    }

    public Cuisine getCuisine() {
        return cuisine;
    }

    public Instant getCookedAt() {
        return cookedAt;
    }

    public BigDecimal getMoneySaved() {
        return moneySaved;
    }
}
