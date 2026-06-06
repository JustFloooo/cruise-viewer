import { generated } from "./generatedData";
import type { CruiseShip } from "./types";

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

export const shipIds: Record<string, string> = {
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

export const ships: CruiseShip[] = [
  ...new Map(
    generated.trips.map((trip) => [
      trip.shipCode,
      {
        id: shipIds[trip.shipCode] ?? trip.shipCode.toLowerCase(),
        code: trip.shipCode,
        name: trip.ship,
        color: shipColors[trip.shipCode] ?? "#008f95",
      },
    ]),
  ).values(),
].sort((a, b) => a.name.localeCompare(b.name));

export const shipById = new Map(ships.map((ship) => [ship.id, ship]));
export const shipByCode = new Map(ships.map((ship) => [ship.code, ship]));
