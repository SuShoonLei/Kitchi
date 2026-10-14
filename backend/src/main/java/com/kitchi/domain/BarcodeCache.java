package com.kitchi.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "barcode_cache")
public class BarcodeCache extends BaseEntity {

    @Column(nullable = false, unique = true, length = 14)
    private String code;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 32)
    private String category;

    @Column(length = 80)
    private String quantityText;

    @Column(nullable = false)
    private Instant fetchedAt;

    protected BarcodeCache() {}

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }

    public String getQuantityText() {
        return quantityText;
    }

    public Instant getFetchedAt() {
        return fetchedAt;
    }
}
