package com.kitchi;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;

final class PostgresTestDatabase {

    private static final PostgreSQLContainer<?> CONTAINER = startIfNeeded();

    private PostgresTestDatabase() {}

    static void register(DynamicPropertyRegistry registry) {
        if (hasExternalDatabase()) {
            registry.add("DB_URL", () -> required("TEST_DB_URL"));
            registry.add("DB_USER", () -> required("TEST_DB_USER"));
            registry.add("DB_PASSWORD", () -> blankable("TEST_DB_PASSWORD"));
            return;
        }
        if (CONTAINER == null) {
            throw new IllegalStateException("""
                    Tests need Postgres. Install Docker so Testcontainers can start postgres:16-alpine, \
                    or export TEST_DB_URL, TEST_DB_USER, and TEST_DB_PASSWORD for a local database. \
                    Use a throwaway database and a placeholder password. Do not commit those values.""");
        }
        registry.add("DB_URL", CONTAINER::getJdbcUrl);
        registry.add("DB_USER", CONTAINER::getUsername);
        registry.add("DB_PASSWORD", CONTAINER::getPassword);
    }

    private static PostgreSQLContainer<?> startIfNeeded() {
        if (hasExternalDatabase() || !dockerAvailable()) {
            return null;
        }
        PostgreSQLContainer<?> container = new PostgreSQLContainer<>("postgres:16-alpine");
        container.start();
        return container;
    }

    private static boolean hasExternalDatabase() {
        String url = System.getenv("TEST_DB_URL");
        return url != null && !url.isBlank();
    }

    private static boolean dockerAvailable() {
        try {
            return DockerClientFactory.instance().isDockerAvailable();
        } catch (Throwable exception) {
            return false;
        }
    }

    private static String required(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(name + " is required when TEST_DB_URL is set");
        }
        return value;
    }

    private static String blankable(String name) {
        String value = System.getenv(name);
        if (value == null) {
            throw new IllegalStateException(name + " is required when TEST_DB_URL is set. Use an empty value for local trust authentication.");
        }
        return value;
    }
}
