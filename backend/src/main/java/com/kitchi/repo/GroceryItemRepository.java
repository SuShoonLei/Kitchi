package com.kitchi.repo;

import com.kitchi.domain.GroceryItem;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroceryItemRepository extends JpaRepository<GroceryItem, UUID> {
    List<GroceryItem> findByUserIdOrderByCreatedAtAsc(UUID userId);

    Optional<GroceryItem> findByIdAndUserId(UUID id, UUID userId);

    List<GroceryItem> findByUserIdAndCheckedTrue(UUID userId);
}
