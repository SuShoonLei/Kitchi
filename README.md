# Kitchi

Waste less, taste best. A mobile-first kitchen journal for cooking what you already bought, rescuing food before it expires, and keeping a cheerful tally of grocery and eating-out spending. This pass is the foundation plus the Kitchi brand: theme, navigation, a persisted data model, and the home week folders. Later features plug into the same store and routes.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run lint
npm run build
```

## Folder structure

```
src/app                  Routes. Each page is a thin entry so features can grow in place.
src/components/brand     Mascot, wordmark, logo lockup, and the session splash.
src/components/shell     Sidebar, bottom tab bar, and page transitions.
src/components/holo      Reusable holographic card (tilt, foil, flip).
src/components/home      Home hero, week folders, and the Fridge Rescue strip.
src/components/settings  Cuisine chips, eating-out budget placeholder, and About.
src/components/ui        Sticker controls, page chrome, empty states, and doodles.
src/lib                  Types, Monday–Sunday week math, expiry status, formatting, seed data.
src/store                Zustand store, persisted to localStorage under the key `kitchi`.
```

## What works now

- Home opens with a greeting from Kitchi the pot, then the Fridge Rescue strip and one folder card per week (current week first). Flip a card for groceries, eating out, and money saved.
- A short splash with the motto shows once per browser session and can be skipped.
- Settings cuisine chips are a multi-select and persist on this device. About shows the logo, motto, and version.
- Pantry, scan/manual add, meals, grocery list, and spending are styled placeholders.
- "View details" on a week card opens Spending with that week noted in the query string.

Weeks run Monday through Sunday in the local timezone. Green means fresh, yellow means use within three days, and red means use today or already expired.

The mascot is the pot cropped from `public/brand/logo-kitchi.png`. That file already has a transparent background, so the cream page shows through the sidebar lockup.
