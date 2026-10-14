package com.kitchi.web;

import com.kitchi.domain.IngredientStatus;
import com.kitchi.service.IngredientService;
import com.kitchi.web.dto.IngredientDtos.IngredientBulk;
import com.kitchi.web.dto.IngredientDtos.IngredientCreate;
import com.kitchi.web.dto.IngredientDtos.IngredientPatch;
import com.kitchi.web.dto.IngredientDtos.IngredientResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/ingredients")
public class IngredientController {

    private final IngredientService ingredients;

    public IngredientController(IngredientService ingredients) {
        this.ingredients = ingredients;
    }

    @GetMapping
    public List<IngredientResponse> list(
            @RequestParam(required = false) IngredientStatus status,
            @RequestParam(defaultValue = "expiresAt") String sort) {
        return ingredients.list(status, sort);
    }

    @GetMapping("/expiring")
    public List<IngredientResponse> expiring(@RequestParam(defaultValue = "3") @Min(0) @Max(30) int days) {
        return ingredients.expiring(days);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IngredientResponse create(@RequestBody @jakarta.validation.Valid IngredientCreate request) {
        return ingredients.create(request);
    }

    @PostMapping("/bulk")
    @ResponseStatus(HttpStatus.CREATED)
    public List<IngredientResponse> bulk(@RequestBody @jakarta.validation.Valid IngredientBulk request) {
        return ingredients.createBulk(request);
    }

    @PatchMapping("/{id}")
    public IngredientResponse update(@PathVariable UUID id, @RequestBody @jakarta.validation.Valid IngredientPatch request) {
        return ingredients.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        ingredients.delete(id);
    }

    @PostMapping("/{id}/mark-used")
    public IngredientResponse markUsed(@PathVariable UUID id) {
        return ingredients.markUsed(id);
    }

    @PostMapping("/{id}/mark-wasted")
    public IngredientResponse markWasted(@PathVariable UUID id) {
        return ingredients.markWasted(id);
    }
}
