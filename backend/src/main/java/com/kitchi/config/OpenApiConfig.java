package com.kitchi.config;

import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.parameters.Parameter;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenApiCustomizer deviceHeaders() {
        return openApi -> {
            if (openApi.getPaths() == null) {
                return;
            }
            openApi.getPaths().forEach((path, item) -> {
                if (!path.startsWith("/api/")) {
                    return;
                }
                item.readOperations().forEach(operation -> {
                    operation.addParametersItem(header(
                            "X-Device-Id", true, "Anonymous device UUID. A user row is created the first time it is seen."));
                    operation.addParametersItem(header(
                            "X-Timezone",
                            false,
                            "IANA timezone, such as America/New_York. Invalid values are stored as UTC. Weeks run Monday to Sunday in this zone."));
                });
            });
        };
    }

    private static Parameter header(String name, boolean required, String description) {
        return new Parameter().in("header").name(name).required(required).description(description).schema(new StringSchema());
    }
}
