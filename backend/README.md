# Kitchi API

Java 21, Spring Boot 3, PostgreSQL. The frontend stays in the repo root.

## Run locally

Docker Compose for Postgres lives at the repo root.

```bash
cp .env.example .env
docker compose up -d
set -a && source .env && set +a
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

`DB_URL`, `DB_USER`, and `DB_PASSWORD` are required. There is no password in `application.yml`. Copy the placeholders from `.env.example` and change them on your machine. Do not commit a real `.env`.

The dev profile turns on Swagger at http://localhost:8080/swagger-ui.html and seeds a fake pantry the first time a device id is seen. The prod profile does neither. Swagger lists `X-Device-Id`, the optional `X-Timezone` header, and the spending endpoints.

Send `X-Device-Id` (a UUID) on every `/api/v1` request. A `users` row is created for a new id. Queries are scoped to that user. Another user's ids return 404.

`X-Timezone` is an optional IANA name such as `America/New_York`. Only a valid value updates the stored zone. An invalid or missing header leaves the stored zone alone (new devices start at `UTC`). "Today" and every Monday–Sunday week are calculated in that zone. Food saved, wasted, and the streak use `ingredients.status_changed_at`, so renaming an item does not move its week. CORS allows the origins in `ALLOWED_ORIGINS` (default `http://localhost:3000`).

## API

Ingredients, meals, grocery items and trips, eating out, settings, and `DELETE /api/v1/me` are the journal. Settings accepts the 11 cuisines (Burmese through Mediterranean, title case), a 3-letter currency, and a weekly eating-out budget that is null or zero-or-more with at most two decimal places. An unknown cuisine is a 400 with `fieldErrors`.

Spending:

- `GET /api/v1/spending/weeks?count=8` returns one Monday–Sunday row per week, newest first, including weeks with no activity. `count` defaults to 8 and maxes at 52.
- `GET /api/v1/spending/weeks/{weekStart}` requires a Monday (`YYYY-MM-DD`) and adds that week's trips, eating-out entries, and cooked meals.
- `GET /api/v1/savings/summary` returns all-time saved and wasted totals, this week, last week, and `streakDays`.

`budgetStatus` compares that week's eating-out total with the user's current budget: `NO_BUDGET` when unset, `UNDER` below 80%, `NEAR` from 80% through 100%, `OVER` above 100%. A settings change shows up on the next read.

Barcode lookup and grocery generation are later steps.

## Tests

Tests run against Postgres. They do not start unless one of these is available:

1. Docker, so Testcontainers can start `postgres:16-alpine`.
2. A local database via environment variables. Point them at a throwaway database. The values below are placeholders, same as `.env.example`. Do not commit real credentials.

```bash
export TEST_DB_URL=jdbc:postgresql://localhost:5432/kitchi_test
export TEST_DB_USER=kitchi
export TEST_DB_PASSWORD=change-me
mvn test
```

`TEST_DB_PASSWORD` may be empty when the local server allows your user in without a password. It still has to be set.

When `TEST_DB_URL` is set, Testcontainers is not used. Flyway migrates that database. Create an empty database first (`createdb kitchi_test` or the equivalent). The app's `DB_URL` is separate from `TEST_DB_URL`.
