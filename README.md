# Kitchi

Waste less, taste best. A mobile-first kitchen journal for cooking what you already bought, rescuing food before it expires, and keeping a cheerful tally of grocery and eating-out spending.

## Try the live demo

**[https://kitchibysu.vercel.app](https://kitchibysu.vercel.app)**

The Vercel site runs the **public local-first edition** (`NEXT_PUBLIC_DATA_MODE=local`, the default). A soft badge says “Private by design: your data stays on this device.” Everything you add stays in this browser. A SQLite-in-the-browser engine is coming next; today the local journal still uses the on-device store.

### What to click through

1. **Splash** — short mascot intro once per browser session (tap or press a key to end it early).
2. **Onboarding** — four steps on first visit. Skip ahead to “Make it yours,” pick cuisines and an optional eating-out budget, or use “Skip for now.” Replay it anytime from **Settings → Replay intro**.
3. **Home** — greeting, “Use these first” strip, and week folders. Flip a folder for the breakdown; **View details** opens Spending for that week.
4. **Pantry** — seeded fake food with expiry colours. Edit, mark used, mark wasted, or delete (wasted and delete offer Undo).
5. **Add → Manual** — type an ingredient onto the shelf. Scan stays a placeholder for now.
6. **Grocery list** — add, check, edit, delete items; **Checkout** with a store name. “Generate suggestions” is coming soon.
7. **Spending** — week list, eating-out form, budget badge.
8. **Settings** — cuisines, currency, weekly eating-out budget, and **Delete all my data** (clears this device’s journal and the intro flag).

Meals / recipes are still a placeholder. No account, email, or personal info is collected.

To see splash and onboarding again in the same browser: open DevTools → Application → clear `sessionStorage` key `kitchi:splash` and `localStorage` key `kitchi:onboarded` (or use Delete all my data, then refresh).

## Run locally — public edition (frontend only)

Default for Vercel and for anyone browsing the repo. No Postgres, no Java.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Leave `NEXT_PUBLIC_DATA_MODE` unset (or `local`). You should see the **Private by design** badge.

```bash
npm run lint
npm run build
npm test
```

## Run locally — full mode (Postgres + API + frontend)

`ALLOWED_ORIGINS` defaults to `http://localhost:3000` (comma-separated list). Documented in `backend/README.md`.

```bash
cp .env.example .env
# edit DB_* placeholders on your machine; do not commit .env
docker compose up -d
set -a && source .env && set +a
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

In another terminal, from the repo root:

```bash
cat > .env.local <<'EOF'
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=http://localhost:8080
EOF
npm install
npm run dev
```

Open http://localhost:3000. The first visit creates an anonymous device id, the dev API seeds a fake pantry, and Home, Pantry, Add, Grocery, Spending, and Settings talk to that account. The private-by-design badge is hidden in api mode.

Without Docker, point `DB_URL` / `DB_USER` / `DB_PASSWORD` at a local Postgres database named `kitchi`, and use `TEST_DB_*` for tests (see `backend/README.md`).

## Folder structure

```
src/app                  Routes. Each page is a thin entry so features can grow in place.
src/components/brand     Mascot, wordmark, logo lockup, and the session splash.
src/components/intro     First-visit onboarding overlay.
src/components/shell     Sidebar, bottom tab bar, and page transitions.
src/components/holo      Reusable holographic card (tilt, foil, flip).
src/components/home      Home hero, week folders, and the use-these-first strip.
src/components/pantry    Active pantry list and actions.
src/components/add       Manual add form (scan placeholder).
src/components/grocery   Grocery list and checkout.
src/components/spending  Weeks, eating out, budget badge.
src/components/settings  Cuisines, budget, About, delete data.
src/components/ui        Sticker controls, page chrome, empty states, and doodles.
src/lib                  Types, API client, week math, expiry, seed data, intro gating.
src/store                Zustand UI + demo journal (`localStorage` key `kitchi`).
backend/                 Spring Boot API (see backend/README.md).
```

## Brand notes

Weeks run Monday through Sunday in the local timezone. Green means fresh, yellow means use within three days, and red means use today or already expired.

The mascot is the pot cropped from `public/brand/logo-kitchi.png`. That file already has a transparent background, so the cream page shows through the sidebar lockup.

## API

The Java API lives in `backend/`. See `backend/README.md` for env vars, tests, and the spending endpoints. The public Vercel site does not point at an API yet.
