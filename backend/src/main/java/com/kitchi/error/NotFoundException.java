package com.kitchi.error;

public class NotFoundException extends RuntimeException {
    public NotFoundException() {
        super("Not found");
    }
}
