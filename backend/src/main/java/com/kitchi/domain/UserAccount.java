package com.kitchi.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "users")
public class UserAccount extends BaseEntity {

    @Column(nullable = false, unique = true)
    private UUID deviceId;

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Column(nullable = false, length = 64)
    private String timezone = "UTC";

    private BigDecimal eatingOutBudgetWeekly;

    protected UserAccount() {}

    public UserAccount(UUID deviceId) {
        this.deviceId = deviceId;
    }

    public UUID getDeviceId() {
        return deviceId;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public BigDecimal getEatingOutBudgetWeekly() {
        return eatingOutBudgetWeekly;
    }

    public void setEatingOutBudgetWeekly(BigDecimal eatingOutBudgetWeekly) {
        this.eatingOutBudgetWeekly = eatingOutBudgetWeekly;
    }
}
