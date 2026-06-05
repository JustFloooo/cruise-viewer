import tuiTripsData from "./generated/tuiTrips.json";
import tuiAreaWindowsData from "./generated/tuiAreaWindows.json";

export type LatLng = [number, number];
export type Region = string;
export type SourceConfidence = "official-search" | "partial-route";
export type AreaWindowStatus = "bookable" | "sold-out" | "short-trip" | "inferred-gap" | "transfer";

export type CruiseArea = {
  id: string;
  prefix: string;
  label: string;
  center: LatLng;
  color: string;
};

export type Deployment = {
  id: string;
  shipId: string;
  areaId: string;
  start: string;
  end: string;
  region: Region;
  homePort: string;
  label: string;
  description: string;
  confidence: SourceConfidence;
  sourceName: string;
  sourceUrl: string;
  route: LatLng[];
  ports: string[];
  tripCode: string;
  routeCode?: string;
  soldOut?: boolean;
};

export type CruiseShip = {
  id: string;
  name: string;
  code: string;
  color: string;
};

export type ShipAreaWindow = {
  id: string;
  shipId: string;
  shipCode: string;
  areaId: string;
  start: string;
  end: string;
  status: AreaWindowStatus;
  confidence: number;
  evidenceDays: number;
  sourceTripCodes: string[];
  previousAreaId?: string;
  nextAreaId?: string;
};

type GeneratedStage = {
  name: string;
  portCode?: string;
  country?: string;
  date: string;
  pierLocation?: {
    lat: number;
    lon: number;
  };
};

type GeneratedTrip = {
  tripCode: string;
  tripGroupCode?: string;
  ship: string;
  shipCode: string;
  dateFrom: string;
  dateTo: string;
  headline: string;
  detailUrl: string;
  route?: {
    code?: string;
    name?: string;
    mapSquare?: string;
    mapLandscape?: string;
  };
  ports: string[];
  stages: GeneratedStage[];
  isSoldOut?: boolean;
};

type GeneratedData = {
  sourceUrl: string;
  fetchedAt: string;
  search: {
    fromDate: string;
    toDate: string;
  };
  totalReported: number;
  trips: GeneratedTrip[];
  portLocations: Record<string, { lat: number; lon: number; name: string; country?: string }>;
};

const generated = tuiTripsData as GeneratedData;

type GeneratedAreaWindow = {
  id: string;
  shipCode: string;
  areaId: string;
  start: string;
  end: string;
  status: AreaWindowStatus;
  confidence: number;
  evidenceDays: number;
  sourceTripCodes: string[];
  previousAreaId?: string;
  nextAreaId?: string;
};

type GeneratedAreaWindowsData = {
  generatedAt: string;
  method: {
    description: string;
    maxSameAreaGapDays: number;
    maxTransferGapDays: number;
  };
  windowCount: number;
  windows: GeneratedAreaWindow[];
};

const generatedAreaWindows = tuiAreaWindowsData as GeneratedAreaWindowsData;

export const cruiseAreas: CruiseArea[] = [
  {
    id: "northern-europe",
    prefix: "NE",
    label: "Nordeuropa",
    center: [56.2, 9.8],
    color: "#546f7a",
  },
  {
    id: "south-europe-med",
    prefix: "MM",
    label: "Südeuropa & Mittelmeer",
    center: [38.4, 17.5],
    color: "#2f9c95",
  },
  {
    id: "western-europe",
    prefix: "WE",
    label: "Westeuropa",
    center: [45.5, -8.5],
    color: "#5576a5",
  },
  {
    id: "south-africa",
    prefix: "SA",
    label: "Südafrika",
    center: [-29.5, 22.5],
    color: "#9b6a3d",
  },
  {
    id: "baltic",
    prefix: "OB",
    label: "Ostsee & Baltikum",
    center: [58.0, 19.0],
    color: "#3f83b7",
  },
  {
    id: "orient",
    prefix: "OR",
    label: "Orient",
    center: [24.3, 55.0],
    color: "#c66d4c",
  },
  {
    id: "nordland-gb",
    prefix: "NL",
    label: "Nordland & Großbritannien",
    center: [62.2, 0.5],
    color: "#4f6d7a",
  },
  {
    id: "north-america",
    prefix: "NA",
    label: "Nordamerika",
    center: [42.5, -70.0],
    color: "#7865a8",
  },
  {
    id: "asia",
    prefix: "AS",
    label: "Asien",
    center: [12.0, 104.0],
    color: "#6a994e",
  },
  {
    id: "central-america-caribbean",
    prefix: "KA",
    label: "Mittelamerika & Karibik",
    center: [16.5, -72.0],
    color: "#d1495b",
  },
  {
    id: "canaries",
    prefix: "KN",
    label: "Kanaren",
    center: [28.8, -15.8],
    color: "#f28f3b",
  },
];

const areaByPrefix = new Map(cruiseAreas.map((area) => [area.prefix, area]));
const areaById = new Map(cruiseAreas.map((area) => [area.id, area]));

const shipColors: Record<string, string> = {
  MEINS1: "#008f95",
  MEINS2: "#d1495b",
  MEINS3: "#4f6d7a",
  MEINS4: "#f28f3b",
  MEINS5: "#7b61ff",
  MEINS6: "#2a9d8f",
  MEINS7: "#c05780",
  MEINSR: "#5065a8",
  MEINSF: "#6a994e",
};

const shipIds: Record<string, string> = {
  MEINS1: "ms1",
  MEINS2: "ms2",
  MEINS3: "ms3",
  MEINS4: "ms4",
  MEINS5: "ms5",
  MEINS6: "ms6",
  MEINS7: "ms7",
  MEINSR: "relax",
  MEINSF: "flow",
};

const fallbackPortLocations: Record<string, LatLng> = {
  "95": [38.18, 20.49],
  "157": [41.37, 2.17],
  "203": [60.39, 5.32],
  "300": [36.53, -6.29],
  "358": [37.5, 15.09],
  "402": [42.09, 11.79],
  "426": [55.68, 12.59],
  "430": [39.62, 19.92],
  "511": [51.13, 1.31],
  "519": [42.65, 18.09],
  "777": [62.08, 6.87],
  "875": [41.01, 28.98],
  "1011": [42.43, 18.77],
  "1099": [49.49, 0.11],
  "1118": [34.68, 33.04],
  "1125": [38.71, -9.13],
  "1129": [53.4, -2.99],
  "1186": [36.72, -4.42],
  "1228": [43.3, 5.37],
  "1350": [37.45, 25.33],
  "1685": [50.57, -2.44],
  "1816": [36.44, 28.22],
  "1959": [36.39, 25.46],
  "2083": [50.91, -1.4],
  "2085": [43.51, 16.44],
  "2115": [58.97, 5.73],
  "2186": [35.77, -5.8],
  "2274": [69.65, 18.96],
  "2275": [63.43, 10.4],
  "2328": [35.9, 14.51],
  "2476": [70.98, 25.97],
  "2656": [55.95, -4.76],
  "2657": [41.92, 8.74],
  "2671": [62.47, 6.15],
  "2702": [37.04, 27.43],
  "2863": [58.15, 8.0],
  "2894": [78.22, 15.65],
  "2906": [36.85, 28.27],
  "2950": [38.12, 13.36],
  "2968": [37.94, 23.64],
  "100003029": [68.15, 13.61],
  "100003463": [45.55, -1.06],
  "100003968": [62.74, 7.16],
  "100008239": [53.54, 8.58],
  "100008348": [35.51, 24.02],
  "10008788": [35.34, 25.13],
  "10008878": [59.41, 5.27],
  "10008923": [43.48, -8.24],
  "10008925": [40.47, 17.23],
  "10008927": [61.91, 5.99],
  "10009009": [37.57, 22.8],
};

export const viewerWindow = {
  start: generated.search.fromDate,
  end: generated.search.toDate,
};

export const dataSource = {
  sourceUrl: generated.sourceUrl,
  fetchedAt: generated.fetchedAt,
  totalReported: generated.totalReported,
  loadedTrips: generated.trips.length,
};

export const ships: CruiseShip[] = [...new Map(
  generated.trips.map((trip) => [
    trip.shipCode,
    {
      id: shipIds[trip.shipCode] ?? trip.shipCode.toLowerCase(),
      code: trip.shipCode,
      name: trip.ship,
      color: shipColors[trip.shipCode] ?? "#008f95",
    },
  ]),
).values()].sort((a, b) => a.name.localeCompare(b.name));

function stagePosition(stage: GeneratedStage): LatLng | undefined {
  if (stage.pierLocation) {
    return [stage.pierLocation.lat, stage.pierLocation.lon];
  }

  if (stage.portCode && generated.portLocations[stage.portCode]) {
    const location = generated.portLocations[stage.portCode];
    return [location.lat, location.lon];
  }

  if (stage.portCode && fallbackPortLocations[stage.portCode]) {
    return fallbackPortLocations[stage.portCode];
  }

  return undefined;
}

function routePrefix(trip: GeneratedTrip): string {
  return trip.route?.code?.split("_")[0] ?? "";
}

function classifyArea(trip: GeneratedTrip): CruiseArea {
  const haystack = `${trip.route?.code ?? ""} ${trip.route?.name ?? ""} ${trip.headline} ${trip.ports.join(
    " ",
  )}`.toLowerCase();
  const byPrefix = areaByPrefix.get(routePrefix(trip));
  if (byPrefix) return byPrefix;

  if (haystack.includes("karibik")) return areaById.get("central-america-caribbean")!;
  if (haystack.includes("kanaren")) return areaById.get("canaries")!;
  if (haystack.includes("ostsee") || haystack.includes("baltikum")) return areaById.get("baltic")!;
  if (haystack.includes("norwegen") || haystack.includes("fjord") || haystack.includes("großbritannien")) {
    return areaById.get("nordland-gb")!;
  }
  if (haystack.includes("suedafrika") || haystack.includes("südafrika")) return areaById.get("south-africa")!;
  if (haystack.includes("asien") || haystack.includes("singapur") || haystack.includes("tokio")) {
    return areaById.get("asia")!;
  }
  if (haystack.includes("usa") || haystack.includes("kanada")) return areaById.get("north-america")!;
  if (haystack.includes("orient") || haystack.includes("dubai") || haystack.includes("doha")) {
    return areaById.get("orient")!;
  }
  if (haystack.includes("westeuropa")) return areaById.get("western-europe")!;

  return areaById.get("south-europe-med")!;
}

function routeForTrip(trip: GeneratedTrip): LatLng[] {
  const positions = trip.stages
    .filter((stage) => stage.name !== "Seetag")
    .map(stagePosition)
    .filter(Boolean) as LatLng[];

  return positions.filter((position, index) => {
    const previous = positions[index - 1];
    return !previous || previous[0] !== position[0] || previous[1] !== position[1];
  });
}

function absoluteDetailUrl(detailUrl: string): string {
  return new URL(detailUrl, generated.sourceUrl).toString();
}

export const deployments: Deployment[] = generated.trips
  .map((trip) => {
    const route = routeForTrip(trip);
    const ship = ships.find((candidate) => candidate.code === trip.shipCode);
    const area = classifyArea(trip);
    const ports = trip.ports.length
      ? trip.ports
      : trip.stages.filter((stage) => stage.name !== "Seetag").map((stage) => stage.name);

    return {
      id: trip.tripCode,
      tripCode: trip.tripCode,
      routeCode: trip.route?.code,
      shipId: ship?.id ?? trip.shipCode.toLowerCase(),
      areaId: area.id,
      start: trip.dateFrom,
      end: trip.dateTo,
      region: area.label,
      homePort: area.label,
      label: trip.headline,
      description: `${trip.headline}. ${ports.join(" -> ")}`,
      confidence: "official-search",
      sourceName: "Mein Schiff booking search",
      sourceUrl: absoluteDetailUrl(trip.detailUrl),
      route: route.length >= 2 ? route : [area.center],
      ports,
      soldOut: trip.isSoldOut,
    } satisfies Deployment;
  })
  .filter((deployment) => areaById.has(deployment.areaId));

export const regions: Region[] = cruiseAreas.map((area) => area.label);

export const shipAreaWindows: ShipAreaWindow[] = generatedAreaWindows.windows
  .map((window) => ({
    ...window,
    shipId: shipIds[window.shipCode] ?? window.shipCode.toLowerCase(),
  }))
  .filter((window) => areaById.has(window.areaId));

export function areaForDeployment(deployment: Deployment): CruiseArea {
  return areaById.get(deployment.areaId) ?? cruiseAreas[0];
}

export function areaForWindow(window: ShipAreaWindow): CruiseArea {
  return areaById.get(window.areaId) ?? cruiseAreas[0];
}
