import { ExternalLink, Search } from "lucide-react";
import { areaForWindow } from "../data/areas";
import { dateInDeployment } from "../data/dateMath";
import { deploymentByTripCode } from "../data/deployments";
import { ships } from "../data/ships";
import type { ActiveShip, CruiseShip, ShipAreaWindow } from "../data/types";
import { compactDate, statusLabel } from "../lib/format";
import { areaColorStyle, shipColorStyle } from "../lib/style";

type ShipExplorerProps = {
  activeShips: ActiveShip[];
  selectedShipId: string | undefined;
  selectedShip: CruiseShip | undefined;
  selectedShipJourney: ShipAreaWindow[];
  selectedDate: string;
  onSelectShip: (ship: CruiseShip) => void;
};

export function ShipExplorer({
  activeShips,
  selectedShipId,
  selectedShip,
  selectedShipJourney,
  selectedDate,
  onSelectShip,
}: ShipExplorerProps) {
  return (
    <>
      <section className="fleet-strip" aria-label="Fleet focus">
        <div className="fleet-grid">
        {ships.map((ship) => {
          const activeShip = activeShips.find((candidate) => candidate.ship.id === ship.id);
          const indicatorColor = activeShip?.area.color ?? ship.color;
          return (
            <button
              key={ship.id}
              className="fleet-chip"
              type="button"
              aria-pressed={selectedShipId === ship.id}
              onClick={() => onSelectShip(ship)}
              style={shipColorStyle(indicatorColor)}
            >
                <span />
              {ship.name}
                <small>
                  {activeShip
                    ? `${activeShip.area.label}${activeShip.status !== "bookable" ? ` - ${statusLabel(activeShip.status)}` : ""}`
                    : "No nearby booking"}
                </small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="detail-panel" aria-label="Selected ship journey">
        {selectedShip ? (
          <>
            <div className="focus-heading">
              <span className="eyebrow">Selected Ship</span>
              <h2>{selectedShip.name}</h2>
            </div>
            <div className="journey-list">
              {selectedShipJourney.map((areaWindow) => {
                const area = areaForWindow(areaWindow);
                const isActive = dateInDeployment(selectedDate, areaWindow);
                const sourceDeployment = areaWindow.sourceTripCodes
                  .map((tripCode) => deploymentByTripCode.get(tripCode))
                  .find(Boolean);
                return (
                  <a
                    key={areaWindow.id}
                    className="journey-row"
                    data-active={isActive}
                    aria-disabled={!sourceDeployment}
                    href={sourceDeployment?.sourceUrl ?? "#"}
                    target={sourceDeployment ? "_blank" : undefined}
                    rel={sourceDeployment ? "noreferrer" : undefined}
                    onClick={(event) => {
                      if (!sourceDeployment) event.preventDefault();
                    }}
                    style={areaColorStyle(area.color)}
                  >
                    <span className="journey-dot" />
                    <span>
                      <strong>{area.label}</strong>
                      <small>
                        {compactDate(areaWindow.start)} - {compactDate(areaWindow.end)} -{" "}
                        {statusLabel(areaWindow.status)}
                      </small>
                    </span>
                    {sourceDeployment ? <ExternalLink size={14} /> : <span />}
                  </a>
                );
              })}
            </div>
          </>
        ) : (
          <div className="empty-focus">
            <Search size={18} />
            Pick a ship to see its upcoming area windows.
          </div>
        )}
      </section>
    </>
  );
}
