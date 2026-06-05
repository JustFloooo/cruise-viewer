# Cruise Viewer

Interactive prototype for exploring where Mein Schiff / TUI Cruises ships are likely operating over time.

The current version uses the public Mein Schiff booking search for exact bookable cruise windows. It does not use AIS/live positions, but the ship, date range, route title, ports and itinerary stages come from TUI's own search response.

## Run

```bash
npm install
npm run dev
```

Then open the local Vite URL printed by the terminal.

## Current Data Approach

The generated dataset lives in `src/data/generated/tuiTrips.json` and is adapted for the map by `src/data/tuiDeployments.ts`.

Primary source:

- TUI / Mein Schiff cruise search: https://www.meinschiff.com/de/trips

The TUI search page currently exposes a broad public search window from 05.06.2026 to 02.05.2028. The app calls the same Next.js server action used by the booking page and pages through the cursor responses. On the latest run it fetched 943 trips.

The booking response includes itinerary stages and many stage coordinates. Where a stage has no coordinate, the adapter reuses coordinates seen for the same TUI port code elsewhere in the dataset and falls back to a small local lookup for common ports.

## Data Pipeline Plan

Regenerate the full local dataset:

```bash
npm run fetch:tui
```

Discovery helper for the visible server-rendered cards:


```bash
npm run extract:tui
```

Next improvements:

1. Move the generated JSON out of the JS bundle and load it as a static asset.
2. Add a larger reviewed port coordinate lookup for ports that TUI does not geocode.
3. Collapse overlapping 7/14-night products into canonical physical ship voyages during generation.
4. Add route detail views with the full day-by-day itinerary.

## UI Notes

- The slider controls the selected future date.
- Play advances in weekly steps.
- Solid route lines come from the generated TUI booking search data.
- Dashed route lines indicate a partial coordinate route.
- Marker popups link back to the TUI detail URL.
