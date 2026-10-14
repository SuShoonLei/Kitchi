package com.kitchi.repo;

import com.kitchi.domain.EatingOutEntry;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EatingOutRepository extends JpaRepository<EatingOutEntry, UUID> {
    List<EatingOutEntry> findByUserIdOrderByEntryDateDesc(UUID userId);

    List<EatingOutEntry> findByUserIdAndEntryDateBetweenOrderByEntryDateDesc(
            UUID userId, LocalDate from, LocalDate to);

    Optional<EatingOutEntry> findByIdAndUserId(UUID id, UUID userId);
}
