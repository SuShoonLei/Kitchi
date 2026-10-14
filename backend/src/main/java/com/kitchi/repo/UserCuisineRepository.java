package com.kitchi.repo;

import com.kitchi.domain.UserCuisine;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserCuisineRepository extends JpaRepository<UserCuisine, UUID> {
    List<UserCuisine> findByUserIdOrderByCuisineAsc(UUID userId);

    @Modifying(flushAutomatically = true)
    @Query("delete from UserCuisine cuisine where cuisine.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
