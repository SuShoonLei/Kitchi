package com.kitchi.web;

import com.kitchi.service.EatingOutService;
import com.kitchi.web.dto.SpendingDtos.EatingOutCreate;
import com.kitchi.web.dto.SpendingDtos.EatingOutPatch;
import com.kitchi.web.dto.SpendingDtos.EatingOutResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/eating-out")
public class EatingOutController {

    private final EatingOutService entries;

    public EatingOutController(EatingOutService entries) {
        this.entries = entries;
    }

    @GetMapping
    public List<EatingOutResponse> list() {
        return entries.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EatingOutResponse create(@RequestBody @Valid EatingOutCreate request) {
        return entries.create(request);
    }

    @PatchMapping("/{id}")
    public EatingOutResponse update(@PathVariable UUID id, @RequestBody @Valid EatingOutPatch request) {
        return entries.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        entries.delete(id);
    }
}
