package com.kitchi.service;

import com.kitchi.domain.Ingredient;
import com.kitchi.domain.IngredientStatus;
import com.kitchi.domain.Meal;
import com.kitchi.domain.MealIngredient;
import com.kitchi.domain.UserAccount;
import com.kitchi.error.ConflictException;
import com.kitchi.error.NotFoundException;
import com.kitchi.identity.CurrentUser;
import com.kitchi.identity.UserAccountService;
import com.kitchi.repo.IngredientRepository;
import com.kitchi.repo.MealIngredientRepository;
import com.kitchi.repo.MealRepository;
import com.kitchi.web.dto.MealDtos.CookLine;
import com.kitchi.web.dto.MealDtos.CookRequest;
import com.kitchi.web.dto.MealDtos.MealLine;
import com.kitchi.web.dto.MealDtos.MealResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MealService {

    private final MealRepository meals;
    private final MealIngredientRepository mealIngredients;
    private final IngredientRepository ingredients;
    private final UserAccountService users;
    private final Clock clock;

    public MealService(
            MealRepository meals,
            MealIngredientRepository mealIngredients,
            IngredientRepository ingredients,
            UserAccountService users,
            Clock clock) {
        this.meals = meals;
        this.mealIngredients = mealIngredients;
        this.ingredients = ingredients;
        this.users = users;
        this.clock = clock;
    }

    @Transactional
    public MealResponse cook(CookRequest request) {
        UserAccount user = users.requireAccount(CurrentUser.require());
        Set<UUID> seen = new HashSet<>();
        List<Ingredient> used = new ArrayList<>();
        BigDecimal moneySaved = BigDecimal.ZERO;
        for (CookLine line : request.ingredients()) {
            if (!seen.add(line.ingredientId())) {
                throw new IllegalArgumentException("Each ingredient can be used once per meal");
            }
            Ingredient ingredient = ingredients
                    .findByIdAndUserId(line.ingredientId(), user.getId())
                    .orElseThrow(NotFoundException::new);
            if (ingredient.getStatus() != IngredientStatus.ACTIVE) {
                throw new ConflictException("Only active pantry items can be cooked");
            }
            if (line.quantityUsed().compareTo(ingredient.getQuantity()) > 0) {
                throw new IllegalArgumentException("Quantity used is more than what's in the pantry");
            }
            boolean finishes = line.quantityUsed().compareTo(ingredient.getQuantity()) == 0;
            BigDecimal saved = finishes
                    ? ingredient.getEstimatedPrice()
                    : ingredient.getEstimatedPrice()
                            .multiply(line.quantityUsed())
                            .divide(ingredient.getQuantity(), 2, RoundingMode.HALF_UP);
            if (finishes) {
                ingredient.setStatus(IngredientStatus.USED);
            } else {
                ingredient.setQuantity(ingredient.getQuantity().subtract(line.quantityUsed()));
                ingredient.setEstimatedPrice(ingredient.getEstimatedPrice().subtract(saved).max(BigDecimal.ZERO));
            }
            moneySaved = moneySaved.add(saved);
            used.add(ingredient);
        }
        Meal meal = meals.save(new Meal(user, request.name(), request.cuisine(), Instant.now(clock), moneySaved));
        List<MealLine> lines = new ArrayList<>();
        for (int i = 0; i < used.size(); i++) {
            CookLine line = request.ingredients().get(i);
            Ingredient ingredient = used.get(i);
            mealIngredients.save(new MealIngredient(user, meal, ingredient, line.quantityUsed()));
            lines.add(new MealLine(ingredient.getId(), ingredient.getName(), line.quantityUsed(), ingredient.getUnit()));
        }
        return new MealResponse(meal.getId(), meal.getName(), meal.getCuisine(), meal.getCookedAt(), meal.getMoneySaved(), lines);
    }

    @Transactional(readOnly = true)
    public List<MealResponse> history() {
        return responses(meals.findByUserIdOrderByCookedAtDesc(CurrentUser.require()));
    }

    @Transactional(readOnly = true)
    public List<MealResponse> cookedBetween(Instant start, Instant end) {
        return responses(meals.findCookedBetween(CurrentUser.require(), start, end));
    }

    private List<MealResponse> responses(List<Meal> rows) {
        if (rows.isEmpty()) {
            return List.of();
        }
        Map<UUID, List<MealIngredient>> grouped = mealIngredients
                .findByMealIdIn(rows.stream().map(Meal::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(line -> line.getMeal().getId()));
        return rows.stream()
                .map(meal -> new MealResponse(
                        meal.getId(),
                        meal.getName(),
                        meal.getCuisine(),
                        meal.getCookedAt(),
                        meal.getMoneySaved(),
                        grouped.getOrDefault(meal.getId(), List.of()).stream()
                                .map(line -> new MealLine(
                                        line.getIngredient().getId(),
                                        line.getIngredient().getName(),
                                        line.getQuantityUsed(),
                                        line.getIngredient().getUnit()))
                                .toList()))
                .toList();
    }
}
