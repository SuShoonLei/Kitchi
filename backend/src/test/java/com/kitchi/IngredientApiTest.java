package com.kitchi;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class IngredientApiTest {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        PostgresTestDatabase.register(registry);
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void missingDeviceHeaderIsRejected() throws Exception {
        mockMvc.perform(get("/api/v1/ingredients")).andExpect(status().isBadRequest());
    }

    @Test
    void createListExpireAndHideFromAnotherDevice() throws Exception {
        String device = UUID.randomUUID().toString();
        MvcResult created = mockMvc.perform(post("/api/v1/ingredients")
                        .header("X-Device-Id", device)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Limes","quantity":4,"unit":"count","category":"produce","expiresAt":"2020-01-01","estimatedPrice":1.80}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.source").value("MANUAL"))
                .andReturn();
        String id = com.jayway.jsonpath.JsonPath.read(created.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(get("/api/v1/ingredients").header("X-Device-Id", device).param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Limes"));

        mockMvc.perform(get("/api/v1/ingredients/expiring").header("X-Device-Id", device).param("days", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id));

        mockMvc.perform(post("/api/v1/ingredients/" + id + "/mark-wasted").header("X-Device-Id", device))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WASTED"));

        mockMvc.perform(post("/api/v1/ingredients/" + id + "/mark-used")
                        .header("X-Device-Id", UUID.randomUUID().toString()))
                .andExpect(status().isNotFound());
    }
}
