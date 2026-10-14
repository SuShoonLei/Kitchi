-- Kitchi relational schema.
-- Weeks are Monday-Sunday. Postgres date_trunc('week', ts) already starts on Monday.
-- barcode_cache is shared public product data and is intentionally not user-scoped.

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL UNIQUE,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    eating_out_budget_weekly NUMERIC(12, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT users_currency_len CHECK (char_length(currency) = 3),
    CONSTRAINT users_budget_nonneg CHECK (
        eating_out_budget_weekly IS NULL OR eating_out_budget_weekly >= 0
    )
);

CREATE TABLE user_cuisines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    cuisine VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_cuisines_unique UNIQUE (user_id, cuisine),
    CONSTRAINT user_cuisines_known CHECK (cuisine IN (
        'BURMESE', 'THAI', 'KOREAN', 'JAPANESE', 'CHINESE', 'INDIAN',
        'ITALIAN', 'MEXICAN', 'WESTERN', 'VIETNAMESE', 'MEDITERRANEAN'
    ))
);

CREATE INDEX user_cuisines_user_id_idx ON user_cuisines (user_id);

CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    category VARCHAR(16) NOT NULL,
    added_at TIMESTAMPTZ NOT NULL,
    expires_at DATE NOT NULL,
    estimated_price NUMERIC(12, 2) NOT NULL,
    status VARCHAR(16) NOT NULL,
    source VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ingredients_name_len CHECK (char_length(name) BETWEEN 1 AND 120),
    CONSTRAINT ingredients_unit_len CHECK (char_length(unit) BETWEEN 1 AND 32),
    CONSTRAINT ingredients_quantity_pos CHECK (quantity > 0),
    CONSTRAINT ingredients_price_nonneg CHECK (estimated_price >= 0),
    CONSTRAINT ingredients_category CHECK (category IN (
        'produce', 'dairy', 'protein', 'grain', 'pantry', 'frozen', 'other'
    )),
    CONSTRAINT ingredients_status CHECK (status IN ('ACTIVE', 'USED', 'WASTED', 'EXPIRED')),
    CONSTRAINT ingredients_source CHECK (source IN ('MANUAL', 'SCAN', 'BARCODE'))
);

CREATE INDEX ingredients_user_expires_idx ON ingredients (user_id, expires_at);

CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL,
    cuisine VARCHAR(32) NOT NULL,
    cooked_at TIMESTAMPTZ NOT NULL,
    money_saved NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT meals_name_len CHECK (char_length(name) BETWEEN 1 AND 160),
    CONSTRAINT meals_money_nonneg CHECK (money_saved >= 0),
    CONSTRAINT meals_cuisine_known CHECK (cuisine IN (
        'BURMESE', 'THAI', 'KOREAN', 'JAPANESE', 'CHINESE', 'INDIAN',
        'ITALIAN', 'MEXICAN', 'WESTERN', 'VIETNAMESE', 'MEDITERRANEAN'
    ))
);

CREATE INDEX meals_user_cooked_idx ON meals (user_id, cooked_at);

CREATE TABLE meal_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    meal_id UUID NOT NULL REFERENCES meals (id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients (id) ON DELETE RESTRICT,
    quantity_used NUMERIC(12, 3) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT meal_ingredients_qty_pos CHECK (quantity_used > 0)
);

CREATE INDEX meal_ingredients_user_id_idx ON meal_ingredients (user_id);
CREATE INDEX meal_ingredients_meal_id_idx ON meal_ingredients (meal_id);
CREATE INDEX meal_ingredients_ingredient_id_idx ON meal_ingredients (ingredient_id);

CREATE TABLE grocery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    checked BOOLEAN NOT NULL DEFAULT FALSE,
    estimated_price NUMERIC(12, 2) NOT NULL,
    reason VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT grocery_items_name_len CHECK (char_length(name) BETWEEN 1 AND 120),
    CONSTRAINT grocery_items_unit_len CHECK (char_length(unit) BETWEEN 1 AND 32),
    CONSTRAINT grocery_items_quantity_pos CHECK (quantity > 0),
    CONSTRAINT grocery_items_price_nonneg CHECK (estimated_price >= 0),
    CONSTRAINT grocery_items_reason_len CHECK (reason IS NULL OR char_length(reason) <= 200)
);

CREATE INDEX grocery_items_user_id_idx ON grocery_items (user_id);

CREATE TABLE grocery_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    trip_date DATE NOT NULL,
    store VARCHAR(120) NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT grocery_trips_store_len CHECK (char_length(store) BETWEEN 1 AND 120),
    CONSTRAINT grocery_trips_total_nonneg CHECK (total >= 0)
);

CREATE INDEX grocery_trips_user_date_idx ON grocery_trips (user_id, trip_date);

CREATE TABLE grocery_trip_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES grocery_trips (id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT grocery_trip_items_name_len CHECK (char_length(name) BETWEEN 1 AND 120),
    CONSTRAINT grocery_trip_items_quantity_pos CHECK (quantity > 0),
    CONSTRAINT grocery_trip_items_price_nonneg CHECK (price >= 0)
);

CREATE INDEX grocery_trip_items_user_id_idx ON grocery_trip_items (user_id);
CREATE INDEX grocery_trip_items_trip_id_idx ON grocery_trip_items (trip_id);

CREATE TABLE eating_out_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    place VARCHAR(120) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    note VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT eating_out_place_len CHECK (char_length(place) BETWEEN 1 AND 120),
    CONSTRAINT eating_out_amount_nonneg CHECK (amount >= 0),
    CONSTRAINT eating_out_note_len CHECK (note IS NULL OR char_length(note) <= 500)
);

CREATE INDEX eating_out_user_date_idx ON eating_out_entries (user_id, entry_date);

CREATE TABLE barcode_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(14) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    category VARCHAR(32),
    quantity_text VARCHAR(80),
    fetched_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT barcode_cache_code_digits CHECK (code ~ '^[0-9]{8,14}$'),
    CONSTRAINT barcode_cache_name_len CHECK (char_length(name) BETWEEN 1 AND 160)
);

CREATE OR REPLACE FUNCTION kitchi_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER users_touch BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION kitchi_touch_updated_at();
CREATE TRIGGER user_cuisines_touch BEFORE UPDATE ON user_cuisines
    FOR EACH ROW EXECUTE FUNCTION kitchi_touch_updated_at();
CREATE TRIGGER ingredients_touch BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION kitchi_touch_updated_at();
CREATE TRIGGER meals_touch BEFORE UPDATE ON meals
    FOR EACH ROW EXECUTE FUNCTION kitchi_touch_updated_at();
CREATE TRIGGER meal_ingredients_touch BEFORE UPDATE ON meal_ingredients
    FOR EACH ROW EXECUTE FUNCTION kitchi_touch_updated_at();
CREATE TRIGGER grocery_items_touch BEFORE UPDATE ON grocery_items
    FOR EACH ROW EXECUTE FUNCTION kitchi_touch_updated_at();
CREATE TRIGGER grocery_trips_touch BEFORE UPDATE ON grocery_trips
    FOR EACH ROW EXECUTE FUNCTION kitchi_touch_updated_at();
CREATE TRIGGER grocery_trip_items_touch BEFORE UPDATE ON grocery_trip_items
    FOR EACH ROW EXECUTE FUNCTION kitchi_touch_updated_at();
CREATE TRIGGER eating_out_touch BEFORE UPDATE ON eating_out_entries
    FOR EACH ROW EXECUTE FUNCTION kitchi_touch_updated_at();
CREATE TRIGGER barcode_cache_touch BEFORE UPDATE ON barcode_cache
    FOR EACH ROW EXECUTE FUNCTION kitchi_touch_updated_at();
