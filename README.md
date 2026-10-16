# Kitchi

Waste less, taste best. A mobile-first kitchen journal for cooking what you already bought, rescuing food before it expires, and keeping a cheerful tally of grocery and eating-out spending.

## Try the live demo

**[https://kitchibysu.vercel.app](https://kitchibysu.vercel.app)**

The Vercel site runs in **demo mode** (no backend hosted yet). A yellow sticker says “Demo mode: data stays on this device.” Everything you add is stored in this browser’s `localStorage` only.

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

## Run it locally (demo mode)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Leave `NEXT_PUBLIC_API_URL` unset so the site matches the Vercel demo.

```bash
npm run lint
npm run build
npm test
```

## Run the API and the app together

Postgres, then the API, then the site. `ALLOWED_ORIGINS` defaults to `http://localhost:3000`.

```bash
cp .env.example .env
docker compose up -d
set -a && source .env && set +a
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

In another terminal, from the repo root:

```bash
cp frontend/.env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. The first visit creates an anonymous device id, the dev API seeds a fake pantry, and Home, Pantry, Add, Grocery, Spending, and Settings talk to that account.

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
