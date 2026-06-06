import { areaById, classifyArea } from "./areas";
import { generated } from "./generatedData";
import { routeForTrip } from "./ports";
import { shipByCode } from "./ships";
import type { Deployment } from "./types";

function absoluteDetailUrl(detailUrl: string): string {
  return new URL(detailUrl, generated.sourceUrl).toString();
}

export const deployments: Deployment[] = generated.trips
  .map((trip) => {
    const route = routeForTrip(trip);
    const ship = shipByCode.get(trip.shipCode);
    const area = classifyArea(trip);
    const ports = trip.ports.length
      ? trip.ports
      : trip.stages.filter((stage) => stage.name !== "Seetag").map((stage) => stage.name);

    return {
      id: trip.tripCode,
      tripCode: trip.tripCode,
      routeCode: trip.route?.code,
      routeName: trip.route?.name,
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


export const deploymentByTripCode = new Map(deployments.map((deployment) => [deployment.tripCode, deployment]));
