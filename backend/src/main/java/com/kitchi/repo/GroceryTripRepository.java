package com.kitchi.repo;

import com.kitchi.domain.GroceryTrip;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroceryTripRepository extends JpaRepository<GroceryTrip, UUID> {
    List<GroceryTrip> findByUserIdAndTripDateBetweenOrderByTripDateDesc(UUID userId, LocalDate from, LocalDate to);
}
