package com.kitchi.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "grocery_trip_items")
public class GroceryTripItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private GroceryTrip trip;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    protected GroceryTripItem() {}

    public GroceryTripItem(UserAccount user, GroceryTrip trip, String name, BigDecimal quantity, BigDecimal price) {
        this.user = user;
        this.trip = trip;
        this.name = name;
        this.quantity = quantity;
        this.price = price;
    }

    public GroceryTrip getTrip() {
        return trip;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public BigDecimal getPrice() {
        return price;
    }
}
