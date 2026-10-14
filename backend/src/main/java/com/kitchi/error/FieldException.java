package com.kitchi.error;

import java.util.Map;

public class FieldException extends RuntimeException {

    private final Map<String, String> fieldErrors;

    public FieldException(String field, String message) {
        super("Check the highlighted fields");
        this.fieldErrors = Map.of(field, message);
    }

    public Map<String, String> fieldErrors() {
        return fieldErrors;
    }
}
