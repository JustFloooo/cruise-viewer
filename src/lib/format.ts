import { formatDisplayDate, fromUtcDay } from "../data/dateMath";
import type { Deployment, ShipAreaWindow } from "../data/types";

export function monthLabel(day: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "2-digit",
  }).format(new Date(`${fromUtcDay(day)}T00:00:00Z`));
}

export function compactDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function bookingWindowLabel(deployment: Deployment): string {
  return `${formatDisplayDate(deployment.start)} - ${formatDisplayDate(deployment.end)}`;
}

export function statusLabel(status: ShipAreaWindow["status"]): string {
  if (status === "bookable") return "booking evidence";
  if (status === "sold-out") return "sold out";
  if (status === "short-trip") return "short trip";
  if (status === "transfer") return "transfer";
  return "inferred";
}

export function shortRouteLabel(deployment: Deployment | undefined, fallback: string): string {
  if (deployment?.routeName) {
    return deployment.routeName.replace(/\s+\d+$/, "");
  }

  if (!deployment?.routeCode) return fallback;
  const routePrefix = deployment.routeCode.split("_")[1]?.replace(/-/g, " ");
  return routePrefix ? routePrefix : fallback;
}
