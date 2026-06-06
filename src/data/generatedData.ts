import tuiTripsData from "./generated/tuiTrips.json";
import tuiAreaWindowsData from "./generated/tuiAreaWindows.json";
import type { GeneratedAreaWindowsData, GeneratedData } from "./types";

export const generated = tuiTripsData as GeneratedData;
export const generatedAreaWindows = tuiAreaWindowsData as GeneratedAreaWindowsData;

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
