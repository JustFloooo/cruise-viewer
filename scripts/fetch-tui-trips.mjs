import { mkdir, writeFile } from "node:fs/promises";

const sourceUrl = "https://www.meinschiff.com/de/trips";
const actionId = "4086941eb09df6f5dd7c682a971d570e7e17f6761e";
const outputPath = new URL("../src/data/generated/tuiTrips.json", import.meta.url);

const basePayload = {
  authToken: "",
  orderBy: "nextdate-asc",
  adultPassengers: 2,
  childPassengers: 0,
  fromDate: "2026-06-05",
  toDate: "2028-05-02",
  destinations: [],
  cabins: [],
  duration: [1, 21],
  ships: [],
  originPorts: [],
  category: "all",
  filter: ["show-sold-out"],
  locale: "de",
};

function parseActionResponse(text) {
  const payloadLine = text
    .split(/\r?\n/)
    .find((line) => line.startsWith("1:"));

  if (!payloadLine) {
    throw new Error(`Could not find action payload in response: ${text.slice(0, 200)}`);
  }

  return JSON.parse(payloadLine.slice(2));
}

async function fetchPage(after) {
  const payload = after ? { ...basePayload, after } : basePayload;
  const response = await fetch(sourceUrl, {
    method: "POST",
    headers: {
      accept: "text/x-component",
      "content-type": "text/plain;charset=UTF-8",
      "next-action": actionId,
      origin: "https://www.meinschiff.com",
      referer: sourceUrl,
      "user-agent": "cruise-viewer-prototype/0.2 (+local research)",
    },
    body: JSON.stringify([payload]),
  });

  if (!response.ok) {
    throw new Error(`TUI action failed: ${response.status} ${response.statusText}`);
  }

  const data = parseActionResponse(await response.text());

  if (!data.success) {
    throw new Error(`TUI action returned unsuccessful payload: ${JSON.stringify(data)}`);
  }

  return data;
}

function normalizeCursor(cursor) {
  if (!cursor || cursor === "$undefined") return "";
  return cursor;
}

function compactTrip(trip) {
  return {
    tripCode: trip.tripCode,
    tripGroupCode: trip.tripGroupCode,
    ship: trip.ship,
    shipCode: trip.shipCode,
    dateFrom: trip.dateFrom,
    dateTo: trip.dateTo,
    headline: trip.headline,
    detailUrl: trip.detailUrl,
    route: trip.route
      ? {
          code: trip.route.code,
          name: trip.route.name,
          mapSquare: trip.route.mapSquare,
          mapLandscape: trip.route.mapLandscape,
        }
      : undefined,
    ports: trip.ports ?? [],
    stages: (trip.stages ?? []).map((stage) => ({
      name: stage.name,
      portCode: stage.portCode,
      country: stage.country,
      date: stage.date,
      arrivalDateTime: stage.arrivalDateTime,
      departureDateTime: stage.departureDateTime,
      tenderPort: stage.tenderPort,
      pierLocation: stage.pierLocation,
    })),
    lowestPrice: trip.lowestPrice,
    isSoldOut: trip.isSoldOut,
  };
}

const pages = [];
const tripsByCode = new Map();
let nextCursor = "";
let page = 0;
let totalReported = 0;

do {
  const response = await fetchPage(nextCursor || undefined);
  page += 1;
  totalReported = response.total;
  pages.push({
    page,
    count: response.data.length,
    nextCursor: normalizeCursor(response.nextCursor) || null,
  });

  for (const trip of response.data) {
    tripsByCode.set(trip.tripCode, compactTrip(trip));
  }

  nextCursor = normalizeCursor(response.nextCursor);
  console.log(
    `Fetched page ${page}: ${tripsByCode.size}/${response.total} trips${
      nextCursor ? `, next ${nextCursor}` : ""
    }`,
  );

  await new Promise((resolve) => setTimeout(resolve, 120));
} while (nextCursor);

const trips = [...tripsByCode.values()].sort((a, b) => {
  const dateCompare = a.dateFrom.localeCompare(b.dateFrom);
  if (dateCompare !== 0) return dateCompare;
  return a.tripCode.localeCompare(b.tripCode);
});

const portLocations = new Map();
for (const trip of trips) {
  for (const stage of trip.stages) {
    if (stage.portCode && stage.pierLocation) {
      portLocations.set(stage.portCode, {
        name: stage.name,
        country: stage.country,
        lat: stage.pierLocation.lat,
        lon: stage.pierLocation.lon,
      });
    }
  }
}

const generated = {
  sourceUrl,
  actionId,
  fetchedAt: new Date().toISOString(),
  search: basePayload,
  totalReported,
  pages,
  trips,
  portLocations: Object.fromEntries([...portLocations.entries()].sort(([a], [b]) => a.localeCompare(b))),
};

await mkdir(new URL("../src/data/generated/", import.meta.url), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(generated, null, 2)}\n`, "utf8");

console.log(`Wrote ${trips.length} trips to ${outputPath.pathname}`);
