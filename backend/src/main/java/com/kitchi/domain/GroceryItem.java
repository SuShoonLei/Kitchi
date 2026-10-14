package com.kitchi.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "grocery_items")
public class GroceryItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(nullable = false, length = 32)
    private String unit;

    @Column(nullable = false)
    private boolean checked;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal estimatedPrice;

    @Column(length = 200)
    private String reason;

    protected GroceryItem() {}

    public GroceryItem(
            UserAccount user,
            String name,
            BigDecimal quantity,
            String unit,
            BigDecimal estimatedPrice,
            String reason) {
        this.user = user;
        this.name = name.trim();
        this.quantity = quantity;
        this.unit = unit.trim();
        this.estimatedPrice = estimatedPrice;
        this.reason = reason;
        this.checked = false;
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

    public boolean isChecked() {
        return checked;
    }

    public void setChecked(boolean checked) {
        this.checked = checked;
    }

    public BigDecimal getEstimatedPrice() {
        return estimatedPrice;
    }

    public void setEstimatedPrice(BigDecimal estimatedPrice) {
        this.estimatedPrice = estimatedPrice;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
