import { mkdir, readFile, writeFile } from "node:fs/promises";

const tripsPath = new URL("../src/data/generated/tuiTrips.json", import.meta.url);
const outputPath = new URL("../src/data/generated/tuiAreaWindows.json", import.meta.url);

const dayMs = 24 * 60 * 60 * 1000;
const maxSameAreaGapDays = 60;
const maxTransferGapDays = 45;

const areas = [
  { id: "south-europe-med", prefix: "MM" },
  { id: "western-europe", prefix: "WE" },
  { id: "south-africa", prefix: "SA" },
  { id: "baltic", prefix: "OB" },
  { id: "orient", prefix: "OR" },
  { id: "nordland-gb", prefix: "NL" },
  { id: "north-america", prefix: "NA" },
  { id: "asia", prefix: "AS" },
  { id: "central-america-caribbean", prefix: "KA" },
  { id: "canaries", prefix: "KN" },
];

const areaByPrefix = new Map(areas.map((area) => [area.prefix, area]));

function toUtcDay(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / dayMs);
}

function fromUtcDay(day) {
  return new Date(day * dayMs).toISOString().slice(0, 10);
}

function routePrefix(trip) {
  return trip.route?.code?.split("_")[0] ?? "";
}

function classifyArea(trip) {
  const byPrefix = areaByPrefix.get(routePrefix(trip));
  if (byPrefix) return byPrefix.id;

  const haystack = `${trip.route?.code ?? ""} ${trip.route?.name ?? ""} ${trip.headline} ${(trip.ports ?? []).join(
    " ",
  )}`.toLowerCase();

  if (haystack.includes("karibik")) return "central-america-caribbean";
  if (haystack.includes("kanaren")) return "canaries";
  if (haystack.includes("ostsee") || haystack.includes("baltikum")) return "baltic";
  if (haystack.includes("norwegen") || haystack.includes("fjord") || haystack.includes("großbritannien")) {
    return "nordland-gb";
  }
  if (haystack.includes("südafrika") || haystack.includes("suedafrika")) return "south-africa";
  if (haystack.includes("asien") || haystack.includes("singapur") || haystack.includes("tokio")) return "asia";
  if (haystack.includes("usa") || haystack.includes("kanada")) return "north-america";
  if (haystack.includes("orient") || haystack.includes("dubai") || haystack.includes("doha")) return "orient";
  if (haystack.includes("westeuropa")) return "western-europe";

  return "south-europe-med";
}

function addDayEvidence(calendar, day, trip, areaId) {
  const dayKey = String(day);
  const existing = calendar.get(dayKey) ?? new Map();
  const evidence = existing.get(areaId) ?? { sourceTripCodes: new Set(), soldOutCount: 0, totalCount: 0 };

  evidence.sourceTripCodes.add(trip.tripCode);
  evidence.totalCount += 1;
  if (trip.isSoldOut) evidence.soldOutCount += 1;

  existing.set(areaId, evidence);
  calendar.set(dayKey, existing);
}

function bestEvidenceForDay(areaEvidence) {
  return [...areaEvidence.entries()]
    .map(([areaId, evidence]) => ({ areaId, ...evidence }))
    .sort((a, b) => {
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
      return a.areaId.localeCompare(b.areaId);
    })[0];
}

function officialWindowsForShip(shipCode, trips, searchStart, searchEnd) {
  const calendar = new Map();

  for (const trip of trips) {
    const areaId = classifyArea(trip);
    const start = Math.max(searchStart, toUtcDay(trip.dateFrom));
    const end = Math.min(searchEnd, toUtcDay(trip.dateTo));

    for (let day = start; day <= end; day += 1) {
      addDayEvidence(calendar, day, trip, areaId);
    }
  }

  const windows = [];
  let current;

  for (let day = searchStart; day <= searchEnd; day += 1) {
    const evidence = calendar.get(String(day));
    if (!evidence) {
      if (current) {
        windows.push(current);
        current = undefined;
      }
      continue;
    }

    const best = bestEvidenceForDay(evidence);
    const sourceTripCodes = [...best.sourceTripCodes].sort();
    const status = best.soldOutCount === best.totalCount ? "sold-out" : "bookable";

    if (current && current.areaId === best.areaId && current.status === status) {
      current.endDay = day;
      for (const tripCode of sourceTripCodes) current.sourceTripCodes.add(tripCode);
      current.evidenceDays += 1;
      continue;
    }

    if (current) windows.push(current);
    current = {
      shipCode,
      areaId: best.areaId,
      startDay: day,
      endDay: day,
      status,
      confidence: 1,
      evidenceDays: 1,
      sourceTripCodes: new Set(sourceTripCodes),
    };
  }

  if (current) windows.push(current);
  return windows;
}

function inferredGapWindows(previous, next) {
  const gapStart = previous.endDay + 1;
  const gapEnd = next.startDay - 1;
  const gapDays = gapEnd - gapStart + 1;

  if (gapDays <= 0) return [];

  if (previous.areaId === next.areaId && gapDays <= maxSameAreaGapDays) {
    return [
      {
        shipCode: previous.shipCode,
        areaId: previous.areaId,
        startDay: gapStart,
        endDay: gapEnd,
        status: "inferred-gap",
        confidence: Math.max(0.55, 0.9 - gapDays / 200),
        evidenceDays: 0,
        sourceTripCodes: new Set(),
        previousAreaId: previous.areaId,
        nextAreaId: next.areaId,
      },
    ];
  }

  if (gapDays <= maxTransferGapDays) {
    const splitDay = Math.floor((gapStart + gapEnd) / 2);
    return [
      {
        shipCode: previous.shipCode,
        areaId: previous.areaId,
        startDay: gapStart,
        endDay: splitDay,
        status: "transfer",
        confidence: Math.max(0.45, 0.75 - gapDays / 120),
        evidenceDays: 0,
        sourceTripCodes: new Set(),
        previousAreaId: previous.areaId,
        nextAreaId: next.areaId,
      },
      {
        shipCode: previous.shipCode,
        areaId: next.areaId,
        startDay: splitDay + 1,
        endDay: gapEnd,
        status: "transfer",
        confidence: Math.max(0.45, 0.75 - gapDays / 120),
        evidenceDays: 0,
        sourceTripCodes: new Set(),
        previousAreaId: previous.areaId,
        nextAreaId: next.areaId,
      },
    ].filter((window) => window.startDay <= window.endDay);
  }

  return [];
}

function enrichGaps(windows) {
  const enriched = [];

  for (let index = 0; index < windows.length; index += 1) {
    const current = windows[index];
    const next = windows[index + 1];

    enriched.push(current);
    if (next) enriched.push(...inferredGapWindows(current, next));
  }

  return enriched.sort((a, b) => a.startDay - b.startDay);
}

function compactWindow(window, index) {
  return {
    id: `${window.shipCode}-${String(index + 1).padStart(3, "0")}`,
    shipCode: window.shipCode,
    areaId: window.areaId,
    start: fromUtcDay(window.startDay),
    end: fromUtcDay(window.endDay),
    status: window.status,
    confidence: Number(window.confidence.toFixed(2)),
    evidenceDays: window.evidenceDays,
    sourceTripCodes: [...window.sourceTripCodes].sort(),
    previousAreaId: window.previousAreaId,
    nextAreaId: window.nextAreaId,
  };
}

const generated = JSON.parse(await readFile(tripsPath, "utf8"));
const searchStart = toUtcDay(generated.search.fromDate);
const searchEnd = toUtcDay(generated.search.toDate);
const tripsByShip = Map.groupBy(generated.trips, (trip) => trip.shipCode);
const windows = [];

for (const [shipCode, trips] of [...tripsByShip.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const officialWindows = officialWindowsForShip(shipCode, trips, searchStart, searchEnd);
  const shipWindows = enrichGaps(officialWindows).map(compactWindow);
  windows.push(...shipWindows);
}

const output = {
  sourceTripFile: "tuiTrips.json",
  generatedAt: new Date().toISOString(),
  method: {
    description:
      "Daily trip evidence is classified into broad TUI booking areas, compressed into ship-area windows, and short gaps are inferred automatically.",
    maxSameAreaGapDays,
    maxTransferGapDays,
  },
  search: generated.search,
  windowCount: windows.length,
  windows,
};

await mkdir(new URL("../src/data/generated/", import.meta.url), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(`Wrote ${windows.length} area windows to ${outputPath.pathname}`);
