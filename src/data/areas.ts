import type { CruiseArea, Deployment, GeneratedTrip, Region, ShipAreaWindow } from "./types";

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

export const areaByPrefix = new Map(cruiseAreas.map((area) => [area.prefix, area]));
export const areaById = new Map(cruiseAreas.map((area) => [area.id, area]));

export const regions: Region[] = cruiseAreas.map((area) => area.label);

function routePrefix(trip: GeneratedTrip): string {
  return trip.route?.code?.split("_")[0] ?? "";
}

// NOTE: a parallel (and intentionally slightly different) classifier lives in
// scripts/generate-tui-area-windows.mjs. That build-time copy additionally folds
// NL/OB/WE round-trips from German home ports into a synthetic "northern-europe"
// area, which is why the generated area windows contain "northern-europe" but the
// runtime deployments below never do. Unifying the two is deferred on purpose so
// this refactor does not change behaviour; see App's bookingAreaIdsFor shim.
export function classifyArea(trip: GeneratedTrip): CruiseArea {
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

export function areaForDeployment(deployment: Deployment): CruiseArea {
  return areaById.get(deployment.areaId) ?? cruiseAreas[0];
}

export function areaForWindow(window: ShipAreaWindow): CruiseArea {
  return areaById.get(window.areaId) ?? cruiseAreas[0];
}
