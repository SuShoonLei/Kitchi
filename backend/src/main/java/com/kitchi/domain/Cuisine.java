package com.kitchi.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Cuisine {
    BURMESE("Burmese"),
    THAI("Thai"),
    KOREAN("Korean"),
    JAPANESE("Japanese"),
    CHINESE("Chinese"),
    INDIAN("Indian"),
    ITALIAN("Italian"),
    MEXICAN("Mexican"),
    WESTERN("Western"),
    VIETNAMESE("Vietnamese"),
    MEDITERRANEAN("Mediterranean");

    private final String label;

    Cuisine(String label) {
        this.label = label;
    }

    @JsonValue
    public String label() {
        return label;
    }

    @JsonCreator
    public static Cuisine fromJson(String raw) {
        if (raw == null) {
            return null;
        }
        for (Cuisine cuisine : values()) {
            if (cuisine.label.equalsIgnoreCase(raw) || cuisine.name().equalsIgnoreCase(raw)) {
                return cuisine;
            }
        }
        throw new IllegalArgumentException("Unknown cuisine");
    }
}
