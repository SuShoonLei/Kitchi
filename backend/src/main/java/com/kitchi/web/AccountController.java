package com.kitchi.web;

import com.kitchi.service.SettingsService;
import io.swagger.v3.oas.annotations.Operation;
import com.kitchi.web.dto.SettingsDtos.SettingsResponse;
import com.kitchi.web.dto.SettingsDtos.SettingsUpdate;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class AccountController {

    private final SettingsService settings;

    public AccountController(SettingsService settings) {
        this.settings = settings;
    }

    @GetMapping("/settings")
    public SettingsResponse get() {
        return settings.get();
    }

    @PutMapping("/settings")
    @Operation(summary = "Replace cuisines, currency, and the weekly eating-out budget")
    public SettingsResponse update(@RequestBody @Valid SettingsUpdate request) {
        return settings.update(request);
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMe() {
        settings.deleteMe();
    }
}
