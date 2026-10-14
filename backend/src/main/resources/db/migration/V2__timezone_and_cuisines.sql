-- Timezone is an IANA name. Week boundaries are computed in this zone.
-- Cuisine checks are restated here so all 11 frontend cuisines stay allowed
-- without editing V1.

ALTER TABLE users
    ADD COLUMN timezone VARCHAR(64) NOT NULL DEFAULT 'UTC';

ALTER TABLE users
    ADD CONSTRAINT users_timezone_len CHECK (char_length(timezone) BETWEEN 1 AND 64);

ALTER TABLE user_cuisines DROP CONSTRAINT user_cuisines_known;
ALTER TABLE user_cuisines ADD CONSTRAINT user_cuisines_known CHECK (cuisine IN (
    'BURMESE', 'THAI', 'KOREAN', 'JAPANESE', 'CHINESE', 'INDIAN',
    'ITALIAN', 'MEXICAN', 'WESTERN', 'VIETNAMESE', 'MEDITERRANEAN'
));

ALTER TABLE meals DROP CONSTRAINT meals_cuisine_known;
ALTER TABLE meals ADD CONSTRAINT meals_cuisine_known CHECK (cuisine IN (
    'BURMESE', 'THAI', 'KOREAN', 'JAPANESE', 'CHINESE', 'INDIAN',
    'ITALIAN', 'MEXICAN', 'WESTERN', 'VIETNAMESE', 'MEDITERRANEAN'
));
