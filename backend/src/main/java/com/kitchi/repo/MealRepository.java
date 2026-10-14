package com.kitchi.repo;

import com.kitchi.domain.Meal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MealRepository extends JpaRepository<Meal, UUID> {
    List<Meal> findByUserIdOrderByCookedAtDesc(UUID userId);

    @Query("""
            select meal from Meal meal
            where meal.user.id = :userId
              and meal.cookedAt >= :start
              and meal.cookedAt < :end
            order by meal.cookedAt desc
            """)
    List<Meal> findCookedBetween(
            @Param("userId") UUID userId, @Param("start") Instant start, @Param("end") Instant end);
}
