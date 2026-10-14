package com.kitchi.repo;

import com.kitchi.domain.MealIngredient;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MealIngredientRepository extends JpaRepository<MealIngredient, UUID> {
    List<MealIngredient> findByMealIdIn(Collection<UUID> mealIds);

    boolean existsByIngredientId(UUID ingredientId);
}
