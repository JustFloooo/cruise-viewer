import { areaForWindow } from "../data/areas";
import { shipAreaWindows } from "../data/areaWindows";
import { dateInDeployment, toUtcDay } from "../data/dateMath";
import { shipById } from "../data/ships";
import type { ActiveShip, CruiseShip, ShipAreaWindow } from "../data/types";

const northernEuropeBookingAreaIds = new Set(["baltic", "nordland-gb", "western-europe"]);

// "northern-europe" only exists as a synthetic window area (see areas.ts); the
// bookable deployments behind it are classified into these three sub-areas.
export function bookingAreaIdsFor(areaId: string): Set<string> {
  return areaId === "northern-europe" ? northernEuropeBookingAreaIds : new Set([areaId]);
}

function areaWindowLength(areaWindow: ShipAreaWindow): number {
  return toUtcDay(areaWindow.end) - toUtcDay(areaWindow.start);
}

function activeWindowPriority(areaWindow: ShipAreaWindow): number {
  if (areaWindow.status === "bookable") return 0;
  if (areaWindow.status === "sold-out") return 1;
  if (areaWindow.status === "transfer") return 2;
  return 3;
}

export function bestActiveWindow(areaWindowsForShip: ShipAreaWindow[]): ShipAreaWindow | undefined {
  return [...areaWindowsForShip].sort((a, b) => {
    const priority = activeWindowPriority(a) - activeWindowPriority(b);
    if (priority !== 0) return priority;
    return areaWindowLength(a) - areaWindowLength(b);
  })[0];
}

export function activeShipForWindow(areaWindow: ShipAreaWindow): ActiveShip | undefined {
  const ship = shipById.get(areaWindow.shipId);
  if (!ship) return undefined;
  const area = areaForWindow(areaWindow);
  return {
    ship,
    areaWindow,
    area,
    position: area.center,
    status: areaWindow.status,
  };
}

export function shipAssignmentForDate(ship: CruiseShip, date: string): ActiveShip | undefined {
  const activeWindow = bestActiveWindow(
    shipAreaWindows
      .filter((areaWindow) => areaWindow.shipId === ship.id)
      .filter((areaWindow) => dateInDeployment(date, areaWindow)),
  );
  return activeWindow ? activeShipForWindow(activeWindow) : undefined;
}
