package com.kitchi.web;

import com.kitchi.service.MealService;
import com.kitchi.web.dto.MealDtos.CookRequest;
import com.kitchi.web.dto.MealDtos.MealResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/meals")
public class MealController {

    private final MealService meals;

    public MealController(MealService meals) {
        this.meals = meals;
    }

    @PostMapping("/cook")
    @ResponseStatus(HttpStatus.CREATED)
    public MealResponse cook(@RequestBody @Valid CookRequest request) {
        return meals.cook(request);
    }

    @GetMapping("/history")
    public List<MealResponse> history() {
        return meals.history();
    }
}
