package com.kitchi.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "grocery_trips")
public class GroceryTrip extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(nullable = false)
    private LocalDate tripDate;

    @Column(nullable = false, length = 120)
    private String store;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    protected GroceryTrip() {}

    public GroceryTrip(UserAccount user, LocalDate tripDate, String store, BigDecimal total) {
        this.user = user;
        this.tripDate = tripDate;
        this.store = store.trim();
        this.total = total;
    }

    public LocalDate getTripDate() {
        return tripDate;
    }

    public String getStore() {
        return store;
    }

    public BigDecimal getTotal() {
        return total;
    }
}
