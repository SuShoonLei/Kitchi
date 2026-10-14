package com.kitchi.repo;

import com.kitchi.domain.GroceryTripItem;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroceryTripItemRepository extends JpaRepository<GroceryTripItem, UUID> {
    List<GroceryTripItem> findByTripIdIn(Collection<UUID> tripIds);
}
