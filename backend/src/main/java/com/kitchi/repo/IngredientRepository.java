package com.kitchi.repo;

import com.kitchi.domain.Ingredient;
import com.kitchi.domain.IngredientStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IngredientRepository extends JpaRepository<Ingredient, UUID> {
    List<Ingredient> findByUserIdAndStatusOrderByExpiresAtAsc(UUID userId, IngredientStatus status);

    List<Ingredient> findByUserIdOrderByExpiresAtAsc(UUID userId);

    List<Ingredient> findByUserIdOrderByAddedAtDesc(UUID userId);

    List<Ingredient> findByUserIdAndStatusOrderByAddedAtDesc(UUID userId, IngredientStatus status);

    Optional<Ingredient> findByIdAndUserId(UUID id, UUID userId);

    @Query("""
            select ingredient from Ingredient ingredient
            where ingredient.user.id = :userId
              and ingredient.status = com.kitchi.domain.IngredientStatus.ACTIVE
              and ingredient.expiresAt <= :until
            order by ingredient.expiresAt asc
            """)
    List<Ingredient> findExpiring(@Param("userId") UUID userId, @Param("until") LocalDate until);

    long countByUserId(UUID userId);
}
