import type { LatLng } from "./tuiDeployments";

const dayMs = 24 * 60 * 60 * 1000;

export function toUtcDay(value: string | Date): number {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00Z`) : value;
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / dayMs,
  );
}

export function fromUtcDay(day: number): string {
  return new Date(day * dayMs).toISOString().slice(0, 10);
}

export function formatDisplayDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function dateInDeployment(date: string, deployment: { start: string; end: string }): boolean {
  const day = toUtcDay(date);
  return day >= toUtcDay(deployment.start) && day <= toUtcDay(deployment.end);
}

export function progressInDeployment(date: string, deployment: { start: string; end: string }): number {
  const start = toUtcDay(deployment.start);
  const end = toUtcDay(deployment.end);
  const span = Math.max(1, end - start);
  return (toUtcDay(date) - start) / span;
}

function interpolatePoint(a: LatLng, b: LatLng, amount: number): LatLng {
  return [a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount];
}

export function positionOnRoute(route: LatLng[], progress: number): LatLng {
  if (route.length === 0) {
    return [0, 0];
  }

  if (route.length === 1) {
    return route[0];
  }

  const routeProgress = ((progress % 1) + 1) % 1;
  const segmentProgress = routeProgress * (route.length - 1);
  const segmentIndex = Math.min(Math.floor(segmentProgress), route.length - 2);
  const localProgress = segmentProgress - segmentIndex;

  return interpolatePoint(route[segmentIndex], route[segmentIndex + 1], localProgress);
}

export function sortedByStart<T extends { start: string }>(deployments: T[]): T[] {
  return [...deployments].sort((a, b) => toUtcDay(a.start) - toUtcDay(b.start));
}
