package com.kitchi.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_cuisines")
public class UserCuisine extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Cuisine cuisine;

    protected UserCuisine() {}

    public UserCuisine(UserAccount user, Cuisine cuisine) {
        this.user = user;
        this.cuisine = cuisine;
    }

    public UserAccount getUser() {
        return user;
    }

    public Cuisine getCuisine() {
        return cuisine;
    }
}
