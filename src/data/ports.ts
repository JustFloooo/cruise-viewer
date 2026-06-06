import { generated } from "./generatedData";
import type { GeneratedStage, GeneratedTrip, LatLng } from "./types";

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

export function stagePosition(stage: GeneratedStage): LatLng | undefined {
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

export function routeForTrip(trip: GeneratedTrip): LatLng[] {
  const positions = trip.stages
    .filter((stage) => stage.name !== "Seetag")
    .map(stagePosition)
    .filter(Boolean) as LatLng[];

  return positions.filter((position, index) => {
    const previous = positions[index - 1];
    return !previous || previous[0] !== position[0] || previous[1] !== position[1];
  });
}
