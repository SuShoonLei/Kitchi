package com.kitchi.service;

import com.kitchi.domain.GroceryItem;
import com.kitchi.domain.GroceryTrip;
import com.kitchi.domain.GroceryTripItem;
import com.kitchi.domain.UserAccount;
import com.kitchi.error.NotFoundException;
import com.kitchi.identity.CurrentUser;
import com.kitchi.identity.UserAccountService;
import com.kitchi.identity.UserDates;
import com.kitchi.repo.GroceryItemRepository;
import com.kitchi.repo.GroceryTripItemRepository;
import com.kitchi.repo.GroceryTripRepository;
import com.kitchi.web.dto.GroceryDtos.CheckoutRequest;
import com.kitchi.web.dto.GroceryDtos.GroceryItemCreate;
import com.kitchi.web.dto.GroceryDtos.GroceryItemPatch;
import com.kitchi.web.dto.GroceryDtos.GroceryItemResponse;
import com.kitchi.web.dto.GroceryDtos.TripItemResponse;
import com.kitchi.web.dto.GroceryDtos.TripResponse;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GroceryService {

    private final GroceryItemRepository items;
    private final GroceryTripRepository trips;
    private final GroceryTripItemRepository tripItems;
    private final UserAccountService users;
    private final Clock clock;

    public GroceryService(
            GroceryItemRepository items,
            GroceryTripRepository trips,
            GroceryTripItemRepository tripItems,
            UserAccountService users,
            Clock clock) {
        this.items = items;
        this.trips = trips;
        this.tripItems = tripItems;
        this.users = users;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<GroceryItemResponse> list() {
        return items.findByUserIdOrderByCreatedAtAsc(CurrentUser.require()).stream()
                .map(GroceryService::toResponse)
                .toList();
    }

    @Transactional
    public GroceryItemResponse create(GroceryItemCreate request) {
        GroceryItem saved = items.save(new GroceryItem(
                account(),
                request.name(),
                request.quantity(),
                request.unit(),
                request.estimatedPrice(),
                blankToNull(request.reason())));
        return toResponse(saved);
    }

    @Transactional
    public GroceryItemResponse update(UUID id, GroceryItemPatch patch) {
        GroceryItem item = require(id);
        if (patch.name() != null) {
            item.setName(patch.name());
        }
        if (patch.quantity() != null) {
            item.setQuantity(patch.quantity());
        }
        if (patch.unit() != null) {
            item.setUnit(patch.unit());
        }
        if (patch.checked() != null) {
            item.setChecked(patch.checked());
        }
        if (patch.estimatedPrice() != null) {
            item.setEstimatedPrice(patch.estimatedPrice());
        }
        if (patch.reason() != null) {
            item.setReason(blankToNull(patch.reason()));
        }
        return toResponse(item);
    }

    @Transactional
    public void delete(UUID id) {
        items.delete(require(id));
    }

    @Transactional
    public TripResponse checkout(CheckoutRequest request) {
        UserAccount user = account();
        List<GroceryItem> checked = items.findByUserIdAndCheckedTrue(user.getId());
        if (checked.isEmpty()) {
            throw new IllegalArgumentException("Check at least one item before checkout");
        }
        BigDecimal total = checked.stream()
                .map(GroceryItem::getEstimatedPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        LocalDate date = request.tripDate() == null ? UserDates.today(clock) : request.tripDate();
        GroceryTrip trip = trips.save(new GroceryTrip(user, date, request.store(), total));
        List<TripItemResponse> lines = checked.stream()
                .map(item -> {
                    GroceryTripItem saved = tripItems.save(
                            new GroceryTripItem(user, trip, item.getName(), item.getQuantity(), item.getEstimatedPrice()));
                    items.delete(item);
                    return new TripItemResponse(saved.getId(), saved.getName(), saved.getQuantity(), saved.getPrice());
                })
                .toList();
        return new TripResponse(trip.getId(), trip.getTripDate(), trip.getStore(), trip.getTotal(), lines);
    }

    @Transactional(readOnly = true)
    public List<TripResponse> trips(LocalDate from, LocalDate to) {
        if ((from == null) != (to == null)) {
            throw new IllegalArgumentException("Provide both from and to, or neither");
        }
        LocalDate end = to == null ? UserDates.today(clock) : to;
        LocalDate start = from == null ? end.minusYears(1) : from;
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("from must be on or before to");
        }
        List<GroceryTrip> rows = trips.findByUserIdAndTripDateBetweenOrderByTripDateDesc(CurrentUser.require(), start, end);
        if (rows.isEmpty()) {
            return List.of();
        }
        Map<UUID, List<GroceryTripItem>> grouped = tripItems
                .findByTripIdIn(rows.stream().map(GroceryTrip::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(line -> line.getTrip().getId()));
        return rows.stream()
                .map(trip -> new TripResponse(
                        trip.getId(),
                        trip.getTripDate(),
                        trip.getStore(),
                        trip.getTotal(),
                        grouped.getOrDefault(trip.getId(), List.of()).stream()
                                .map(line -> new TripItemResponse(line.getId(), line.getName(), line.getQuantity(), line.getPrice()))
                                .toList()))
                .toList();
    }

    private GroceryItem require(UUID id) {
        return items.findByIdAndUserId(id, CurrentUser.require()).orElseThrow(NotFoundException::new);
    }

    private UserAccount account() {
        return users.requireAccount(CurrentUser.require());
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static GroceryItemResponse toResponse(GroceryItem item) {
        return new GroceryItemResponse(
                item.getId(),
                item.getName(),
                item.getQuantity(),
                item.getUnit(),
                item.isChecked(),
                item.getEstimatedPrice(),
                item.getReason());
    }
}
