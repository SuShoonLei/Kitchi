package com.kitchi.service;

import com.kitchi.domain.Ingredient;
import com.kitchi.domain.IngredientSource;
import com.kitchi.domain.IngredientStatus;
import com.kitchi.domain.UserAccount;
import com.kitchi.error.ConflictException;
import com.kitchi.error.NotFoundException;
import com.kitchi.identity.CurrentUser;
import com.kitchi.identity.UserAccountService;
import com.kitchi.identity.UserDates;
import com.kitchi.repo.IngredientRepository;
import com.kitchi.repo.MealIngredientRepository;
import com.kitchi.web.dto.IngredientDtos.IngredientBulk;
import com.kitchi.web.dto.IngredientDtos.IngredientCreate;
import com.kitchi.web.dto.IngredientDtos.IngredientPatch;
import com.kitchi.web.dto.IngredientDtos.IngredientResponse;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IngredientService {

    private static final int LIST_CAP = 200;

    private final IngredientRepository ingredients;
    private final MealIngredientRepository mealIngredients;
    private final UserAccountService users;
    private final Clock clock;

    public IngredientService(
            IngredientRepository ingredients,
            MealIngredientRepository mealIngredients,
            UserAccountService users,
            Clock clock) {
        this.ingredients = ingredients;
        this.mealIngredients = mealIngredients;
        this.users = users;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<IngredientResponse> list(IngredientStatus status, String sort) {
        UUID userId = CurrentUser.require();
        List<Ingredient> rows = switch (sort) {
            case "expiresAt" -> status == null
                    ? ingredients.findByUserIdOrderByExpiresAtAsc(userId)
                    : ingredients.findByUserIdAndStatusOrderByExpiresAtAsc(userId, status);
            case "addedAt" -> status == null
                    ? ingredients.findByUserIdOrderByAddedAtDesc(userId)
                    : ingredients.findByUserIdAndStatusOrderByAddedAtDesc(userId, status);
            default -> throw new IllegalArgumentException("Unknown sort");
        };
        return rows.stream().limit(LIST_CAP).map(IngredientService::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<IngredientResponse> expiring(int days) {
        LocalDate until = UserDates.today(clock).plusDays(days);
        return ingredients.findExpiring(CurrentUser.require(), until).stream()
                .limit(LIST_CAP)
                .map(IngredientService::toResponse)
                .toList();
    }

    @Transactional
    public IngredientResponse create(IngredientCreate request) {
        Ingredient saved = ingredients.save(fromCreate(account(), request, Instant.now(clock)));
        return toResponse(saved);
    }

    @Transactional
    public List<IngredientResponse> createBulk(IngredientBulk request) {
        UserAccount user = account();
        Instant addedAt = Instant.now(clock);
        List<IngredientResponse> created = new ArrayList<>();
        for (IngredientCreate item : request.items()) {
            created.add(toResponse(ingredients.save(fromCreate(user, item, addedAt))));
        }
        return created;
    }

    @Transactional
    public IngredientResponse update(UUID id, IngredientPatch patch) {
        Ingredient ingredient = require(id);
        if (patch.name() != null) {
            ingredient.setName(patch.name());
        }
        if (patch.quantity() != null) {
            ingredient.setQuantity(patch.quantity());
        }
        if (patch.unit() != null) {
            ingredient.setUnit(patch.unit());
        }
        if (patch.category() != null) {
            ingredient.setCategory(patch.category());
        }
        if (patch.expiresAt() != null) {
            ingredient.setExpiresAt(patch.expiresAt());
        }
        if (patch.estimatedPrice() != null) {
            ingredient.setEstimatedPrice(patch.estimatedPrice());
        }
        return toResponse(ingredient);
    }

    @Transactional
    public void delete(UUID id) {
        Ingredient ingredient = require(id);
        if (mealIngredients.existsByIngredientId(ingredient.getId())) {
            throw new ConflictException("This ingredient is part of a cooked meal.");
        }
        ingredients.delete(ingredient);
    }

    @Transactional
    public IngredientResponse markUsed(UUID id) {
        Ingredient ingredient = require(id);
        ingredient.setStatus(IngredientStatus.USED);
        return toResponse(ingredient);
    }

    @Transactional
    public IngredientResponse markWasted(UUID id) {
        Ingredient ingredient = require(id);
        ingredient.setStatus(IngredientStatus.WASTED);
        return toResponse(ingredient);
    }

    Ingredient require(UUID id) {
        return ingredients.findByIdAndUserId(id, CurrentUser.require()).orElseThrow(NotFoundException::new);
    }

    private UserAccount account() {
        return users.requireAccount(CurrentUser.require());
    }

    private static Ingredient fromCreate(UserAccount user, IngredientCreate request, Instant addedAt) {
        IngredientSource source = request.source() == null ? IngredientSource.MANUAL : request.source();
        return new Ingredient(
                user,
                request.name(),
                request.quantity(),
                request.unit(),
                request.category(),
                addedAt,
                request.expiresAt(),
                request.estimatedPrice(),
                source);
    }

    static IngredientResponse toResponse(Ingredient ingredient) {
        return new IngredientResponse(
                ingredient.getId(),
                ingredient.getName(),
                ingredient.getQuantity(),
                ingredient.getUnit(),
                ingredient.getCategory(),
                ingredient.getAddedAt(),
                ingredient.getExpiresAt(),
                ingredient.getEstimatedPrice(),
                ingredient.getStatus(),
                ingredient.getSource());
    }
}
