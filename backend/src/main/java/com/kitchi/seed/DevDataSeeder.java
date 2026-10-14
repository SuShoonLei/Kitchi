package com.kitchi.seed;

import com.kitchi.domain.Cuisine;
import com.kitchi.domain.EatingOutEntry;
import com.kitchi.domain.GroceryItem;
import com.kitchi.domain.GroceryTrip;
import com.kitchi.domain.GroceryTripItem;
import com.kitchi.domain.Ingredient;
import com.kitchi.domain.IngredientCategory;
import com.kitchi.domain.IngredientSource;
import com.kitchi.domain.Meal;
import com.kitchi.domain.MealIngredient;
import com.kitchi.domain.UserAccount;
import com.kitchi.domain.UserCuisine;
import com.kitchi.repo.EatingOutRepository;
import com.kitchi.repo.GroceryItemRepository;
import com.kitchi.repo.GroceryTripItemRepository;
import com.kitchi.repo.GroceryTripRepository;
import com.kitchi.repo.IngredientRepository;
import com.kitchi.repo.MealIngredientRepository;
import com.kitchi.repo.MealRepository;
import com.kitchi.repo.UserCuisineRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DevDataSeeder {

    private final boolean enabled;
    private final Clock clock;
    private final IngredientRepository ingredients;
    private final MealRepository meals;
    private final MealIngredientRepository mealIngredients;
    private final GroceryItemRepository groceryItems;
    private final GroceryTripRepository trips;
    private final GroceryTripItemRepository tripItems;
    private final EatingOutRepository eatingOut;
    private final UserCuisineRepository cuisines;

    public DevDataSeeder(
            @Value("${kitchi.seed-on-create}") boolean enabled,
            Clock clock,
            IngredientRepository ingredients,
            MealRepository meals,
            MealIngredientRepository mealIngredients,
            GroceryItemRepository groceryItems,
            GroceryTripRepository trips,
            GroceryTripItemRepository tripItems,
            EatingOutRepository eatingOut,
            UserCuisineRepository cuisines) {
        this.enabled = enabled;
        this.clock = clock;
        this.ingredients = ingredients;
        this.meals = meals;
        this.mealIngredients = mealIngredients;
        this.groceryItems = groceryItems;
        this.trips = trips;
        this.tripItems = tripItems;
        this.eatingOut = eatingOut;
        this.cuisines = cuisines;
    }

    public void seedIfEnabled(UserAccount user) {
        if (!enabled) {
            return;
        }
        ZoneId zone = ZoneId.of(user.getTimezone());
        LocalDate today = LocalDate.now(clock.withZone(zone));
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        Map<String, Ingredient> pantry = seedIngredients(user, today, zone);
        seedMeals(user, monday, pantry, zone);
        seedTrips(user, monday);
        seedEatingOut(user, monday);
        seedGroceryList(user);
        cuisines.save(new UserCuisine(user, Cuisine.BURMESE));
        cuisines.save(new UserCuisine(user, Cuisine.THAI));
        cuisines.save(new UserCuisine(user, Cuisine.ITALIAN));
    }

    private Map<String, Ingredient> seedIngredients(UserAccount user, LocalDate today, ZoneId zone) {
        Ingredient[] rows = {
            ingredient(user, zone, "Cilantro", "1", "bunch", IngredientCategory.produce, today.minusDays(6), today.minusDays(1), "1.50"),
            ingredient(user, zone, "Whole milk", "1", "liter", IngredientCategory.dairy, today.minusDays(5), today, "3.80"),
            ingredient(user, zone, "Chicken thighs", "1.2", "lb", IngredientCategory.protein, today.minusDays(2), today.plusDays(1), "7.40"),
            ingredient(user, zone, "Baby spinach", "5", "oz", IngredientCategory.produce, today.minusDays(2), today.plusDays(2), "3.20"),
            ingredient(user, zone, "Firm tofu", "14", "oz", IngredientCategory.protein, today.minusDays(1), today.plusDays(2), "2.40"),
            ingredient(user, zone, "Roma tomatoes", "4", "count", IngredientCategory.produce, today.minusDays(4), today.plusDays(3), "2.80"),
            ingredient(user, zone, "Bell peppers", "2", "count", IngredientCategory.produce, today.minusDays(4), today.plusDays(4), "2.60"),
            ingredient(user, zone, "Plain yogurt", "2", "cups", IngredientCategory.dairy, today.minusDays(3), today.plusDays(6), "1.90"),
            ingredient(user, zone, "Eggs", "8", "count", IngredientCategory.protein, today.minusDays(3), today.plusDays(12), "4.50"),
            ingredient(user, zone, "Lemons", "3", "count", IngredientCategory.produce, today.minusDays(4), today.plusDays(14), "1.70"),
            ingredient(user, zone, "Jasmine rice", "2", "lb", IngredientCategory.grain, today.minusDays(20), today.plusDays(120), "3.40"),
            ingredient(user, zone, "Fish sauce", "1", "bottle", IngredientCategory.pantry, today.minusDays(30), today.plusDays(200), "4.10")
        };
        Map<String, Ingredient> byName = new HashMap<>();
        for (Ingredient row : rows) {
            byName.put(row.getName(), ingredients.save(row));
        }
        return byName;
    }

    private void seedMeals(UserAccount user, LocalDate monday, Map<String, Ingredient> pantry, ZoneId zone) {
        meal(user, monday, 0, 0, "Tomato egg skillet", Cuisine.WESTERN, "8.40", pantry, zone, "Eggs", "2", "Roma tomatoes", "2");
        meal(user, monday, 1, 1, "Chicken thigh curry", Cuisine.BURMESE, "11.50", pantry, zone, "Chicken thighs", "0.8", "Fish sauce", "1");
        meal(user, monday, 1, 3, "Tofu basil stir-fry", Cuisine.THAI, "8.25", pantry, zone, "Firm tofu", "7", "Bell peppers", "1");
        meal(user, monday, 1, 5, "Spinach omelette", Cuisine.WESTERN, "6.75", pantry, zone, "Eggs", "2", "Baby spinach", "2");
        meal(user, monday, 2, 2, "Lemongrass chicken soup", Cuisine.THAI, "9.40", pantry, zone, "Chicken thighs", "0.5");
        meal(user, monday, 2, 4, "Herb chicken rice", Cuisine.BURMESE, "9.60", pantry, zone, "Jasmine rice", "1", "Cilantro", "0.5");
        meal(user, monday, 3, 0, "Chili garlic noodles", Cuisine.CHINESE, "8.20", pantry, zone, "Bell peppers", "1");
        meal(user, monday, 3, 2, "Tomato dal", Cuisine.INDIAN, "7.10", pantry, zone, "Roma tomatoes", "2");
        meal(user, monday, 3, 4, "Pepper omelette", Cuisine.WESTERN, "6.40", pantry, zone, "Eggs", "2", "Bell peppers", "1");
        meal(user, monday, 3, 6, "Yogurt rice", Cuisine.INDIAN, "5.80", pantry, zone, "Plain yogurt", "1", "Jasmine rice", "1");
    }

    private void seedTrips(UserAccount user, LocalDate monday) {
        trip(user, monday, 0, 0, "Green Market", "46.80",
                line("Chicken thighs", "12.40"), line("Mixed produce", "14.20"), line("Dairy", "11.80"), line("Pantry staples", "8.40"));
        trip(user, monday, 1, 1, "Corner Grocer", "72.15",
                line("Rice and noodles", "16.40"), line("Market vegetables", "22.75"), line("Chicken and tofu", "21.10"), line("Sauces and yogurt", "11.90"));
        trip(user, monday, 2, 3, "Sunrise Foods", "61.40",
                line("Fish and lemons", "18.60"), line("Greens", "14.30"), line("Eggs and milk", "12.50"), line("Rice", "16.00"));
        trip(user, monday, 3, 5, "Harbor Produce", "88.20",
                line("Produce haul", "28.40"), line("Meat and tofu", "31.15"), line("Dairy", "14.25"), line("Pantry restock", "14.40"));
    }

    private void seedEatingOut(UserAccount user, LocalDate monday) {
        eatingOut.save(new EatingOutEntry(user, monday, "Little Rangoon", money("18.50"), null));
        eatingOut.save(new EatingOutEntry(user, monday.minusWeeks(1).plusDays(2), "Basil & Chili", money("22.00"), null));
        eatingOut.save(new EatingOutEntry(user, monday.minusWeeks(1).plusDays(4), "Market stall lunch", money("12.00"), null));
        eatingOut.save(new EatingOutEntry(user, monday.minusWeeks(2).plusDays(5), "Sunday Noodle Bar", money("22.75"), null));
        eatingOut.save(new EatingOutEntry(user, monday.minusWeeks(3).plusDays(1), "Little Rangoon", money("24.80"), null));
        eatingOut.save(new EatingOutEntry(user, monday.minusWeeks(3).plusDays(4), "Corner counter", money("16.50"), null));
    }

    private void seedGroceryList(UserAccount user) {
        groceryItems.save(new GroceryItem(user, "Jasmine rice", BigDecimal.ONE, "count", money("4.20"), null));
        groceryItems.save(new GroceryItem(user, "Limes", new BigDecimal("4"), "count", money("1.80"), null));
        groceryItems.save(new GroceryItem(user, "Eggs", new BigDecimal("12"), "count", money("5.40"), null));
        groceryItems.save(new GroceryItem(user, "Fish sauce", BigDecimal.ONE, "count", money("4.10"), null));
    }

    private Ingredient ingredient(
            UserAccount user,
            ZoneId zone,
            String name,
            String quantity,
            String unit,
            IngredientCategory category,
            LocalDate added,
            LocalDate expires,
            String price) {
        return new Ingredient(
                user, name, new BigDecimal(quantity), unit, category, atNoon(added, zone), expires, money(price), IngredientSource.MANUAL);
    }

    private void meal(
            UserAccount user,
            LocalDate monday,
            int weeksAgo,
            int dayOffset,
            String name,
            Cuisine cuisine,
            String moneySaved,
            Map<String, Ingredient> pantry,
            ZoneId zone,
            String... lines) {
        Meal meal = meals.save(new Meal(
                user, name, cuisine, atNoon(monday.minusWeeks(weeksAgo).plusDays(dayOffset), zone), money(moneySaved)));
        for (int i = 0; i < lines.length; i += 2) {
            Ingredient ingredient = pantry.get(lines[i]);
            mealIngredients.save(new MealIngredient(user, meal, ingredient, new BigDecimal(lines[i + 1])));
        }
    }

    private void trip(UserAccount user, LocalDate monday, int weeksAgo, int dayOffset, String store, String total, Line... lines) {
        GroceryTrip trip = trips.save(new GroceryTrip(
                user, monday.minusWeeks(weeksAgo).plusDays(dayOffset), store, money(total)));
        for (Line line : lines) {
            tripItems.save(new GroceryTripItem(user, trip, line.name(), BigDecimal.ONE, line.price()));
        }
    }

    private Instant atNoon(LocalDate date, ZoneId zone) {
        Instant noon = date.atTime(12, 0).atZone(zone).toInstant();
        Instant now = Instant.now(clock);
        return noon.isAfter(now) ? now : noon;
    }

    private static BigDecimal money(String value) {
        return new BigDecimal(value);
    }

    private static Line line(String name, String price) {
        return new Line(name, money(price));
    }

    private record Line(String name, BigDecimal price) {}
}
