package com.kitchi.web;

import com.kitchi.service.GroceryService;
import com.kitchi.web.dto.GroceryDtos.CheckoutRequest;
import com.kitchi.web.dto.GroceryDtos.GroceryItemCreate;
import com.kitchi.web.dto.GroceryDtos.GroceryItemPatch;
import com.kitchi.web.dto.GroceryDtos.GroceryItemResponse;
import com.kitchi.web.dto.GroceryDtos.TripResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
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

@RestController
@RequestMapping("/api/v1")
public class GroceryController {

    private final GroceryService groceries;

    public GroceryController(GroceryService groceries) {
        this.groceries = groceries;
    }

    @GetMapping("/grocery-items")
    public List<GroceryItemResponse> list() {
        return groceries.list();
    }

    @PostMapping("/grocery-items")
    @ResponseStatus(HttpStatus.CREATED)
    public GroceryItemResponse create(@RequestBody @Valid GroceryItemCreate request) {
        return groceries.create(request);
    }

    @PatchMapping("/grocery-items/{id}")
    public GroceryItemResponse update(@PathVariable UUID id, @RequestBody @Valid GroceryItemPatch request) {
        return groceries.update(id, request);
    }

    @DeleteMapping("/grocery-items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        groceries.delete(id);
    }

    @PostMapping("/grocery-trips")
    @ResponseStatus(HttpStatus.CREATED)
    public TripResponse checkout(@RequestBody @Valid CheckoutRequest request) {
        return groceries.checkout(request);
    }

    @GetMapping("/grocery-trips")
    public List<TripResponse> trips(
            @RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to) {
        return groceries.trips(from, to);
    }
}
