package com.kitchi.service;

import com.kitchi.domain.EatingOutEntry;
import com.kitchi.error.NotFoundException;
import com.kitchi.identity.CurrentUser;
import com.kitchi.identity.UserAccountService;
import com.kitchi.repo.EatingOutRepository;
import com.kitchi.web.dto.SpendingDtos.EatingOutCreate;
import com.kitchi.web.dto.SpendingDtos.EatingOutPatch;
import com.kitchi.web.dto.SpendingDtos.EatingOutResponse;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EatingOutService {

    private final EatingOutRepository entries;
    private final UserAccountService users;

    public EatingOutService(EatingOutRepository entries, UserAccountService users) {
        this.entries = entries;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<EatingOutResponse> list() {
        return entries.findByUserIdOrderByEntryDateDesc(CurrentUser.require()).stream()
                .map(EatingOutService::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EatingOutResponse> between(LocalDate from, LocalDate to) {
        return entries.findByUserIdAndEntryDateBetweenOrderByEntryDateDesc(CurrentUser.require(), from, to).stream()
                .map(EatingOutService::toResponse)
                .toList();
    }

    @Transactional
    public EatingOutResponse create(EatingOutCreate request) {
        EatingOutEntry saved = entries.save(new EatingOutEntry(
                users.requireAccount(CurrentUser.require()),
                request.entryDate(),
                request.place(),
                request.amount(),
                blankToNull(request.note())));
        return toResponse(saved);
    }

    @Transactional
    public EatingOutResponse update(UUID id, EatingOutPatch patch) {
        EatingOutEntry entry = require(id);
        if (patch.entryDate() != null) {
            entry.setEntryDate(patch.entryDate());
        }
        if (patch.place() != null) {
            entry.setPlace(patch.place());
        }
        if (patch.amount() != null) {
            entry.setAmount(patch.amount());
        }
        if (patch.note() != null) {
            entry.setNote(blankToNull(patch.note()));
        }
        return toResponse(entry);
    }

    @Transactional
    public void delete(UUID id) {
        entries.delete(require(id));
    }

    private EatingOutEntry require(UUID id) {
        return entries.findByIdAndUserId(id, CurrentUser.require()).orElseThrow(NotFoundException::new);
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static EatingOutResponse toResponse(EatingOutEntry entry) {
        return new EatingOutResponse(
                entry.getId(), entry.getEntryDate(), entry.getPlace(), entry.getAmount(), entry.getNote());
    }
}
