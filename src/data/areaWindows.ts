import { areaById } from "./areas";
import { generatedAreaWindows } from "./generatedData";
import { shipIds } from "./ships";
import type { ShipAreaWindow } from "./types";

export const shipAreaWindows: ShipAreaWindow[] = generatedAreaWindows.windows
  .map((window) => ({
    ...window,
    shipId: shipIds[window.shipCode] ?? window.shipCode.toLowerCase(),
  }))
  .filter((window) => areaById.has(window.areaId));
