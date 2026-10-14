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
@Table(name = "eating_out_entries")
public class EatingOutEntry extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(nullable = false)
    private LocalDate entryDate;

    @Column(nullable = false, length = 120)
    private String place;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(length = 500)
    private String note;

    protected EatingOutEntry() {}

    public EatingOutEntry(UserAccount user, LocalDate entryDate, String place, BigDecimal amount, String note) {
        this.user = user;
        this.entryDate = entryDate;
        this.place = place.trim();
        this.amount = amount;
        this.note = note;
    }

    public LocalDate getEntryDate() {
        return entryDate;
    }

    public void setEntryDate(LocalDate entryDate) {
        this.entryDate = entryDate;
    }

    public String getPlace() {
        return place;
    }

    public void setPlace(String place) {
        this.place = place.trim();
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
