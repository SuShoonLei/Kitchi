package com.kitchi.service;

import com.kitchi.domain.Cuisine;
import com.kitchi.domain.UserAccount;
import com.kitchi.domain.UserCuisine;
import com.kitchi.identity.CurrentUser;
import com.kitchi.identity.UserAccountService;
import com.kitchi.repo.UserAccountRepository;
import com.kitchi.repo.UserCuisineRepository;
import com.kitchi.web.dto.SettingsDtos.SettingsResponse;
import com.kitchi.web.dto.SettingsDtos.SettingsUpdate;
import jakarta.persistence.EntityManager;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettingsService {

    private final UserAccountRepository users;
    private final UserAccountService accounts;
    private final UserCuisineRepository cuisines;
    private final EntityManager entityManager;

    public SettingsService(
            UserAccountRepository users,
            UserAccountService accounts,
            UserCuisineRepository cuisines,
            EntityManager entityManager) {
        this.users = users;
        this.accounts = accounts;
        this.cuisines = cuisines;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public SettingsResponse get() {
        UUID userId = CurrentUser.require();
        UserAccount user = accounts.requireAccount(userId);
        List<Cuisine> preferred = cuisines.findByUserIdOrderByCuisineAsc(userId).stream()
                .map(UserCuisine::getCuisine)
                .toList();
        return new SettingsResponse(preferred, user.getCurrency(), user.getEatingOutBudgetWeekly());
    }

    @Transactional
    public SettingsResponse update(SettingsUpdate request) {
        UserAccount user = accounts.requireAccount(CurrentUser.require());
        user.setCurrency(request.currency().toUpperCase());
        user.setEatingOutBudgetWeekly(request.eatingOutBudgetWeekly());
        cuisines.deleteByUserId(user.getId());
        entityManager.flush();
        for (Cuisine cuisine : new LinkedHashSet<>(request.cuisines())) {
            cuisines.save(new UserCuisine(user, cuisine));
        }
        return get();
    }

    @Transactional
    public void deleteMe() {
        users.deleteById(CurrentUser.require());
    }
}
