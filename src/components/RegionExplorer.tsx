import { ExternalLink, Search } from "lucide-react";
import { shipById } from "../data/ships";
import type { AreaGroup, Deployment } from "../data/types";
import { bookingWindowLabel, statusLabel } from "../lib/format";
import { areaColorStyle } from "../lib/style";

type RegionExplorerProps = {
  areaGroups: AreaGroup[];
  selectedAreaGroup: AreaGroup | undefined;
  selectedAreaBookings: Deployment[];
  onSelectArea: (areaId: string) => void;
};

export function RegionExplorer({
  areaGroups,
  selectedAreaGroup,
  selectedAreaBookings,
  onSelectArea,
}: RegionExplorerProps) {
  return (
    <>
      <section className="area-board" aria-label="Active regions">
        {areaGroups.map((group) => (
          <button
            key={group.area.id}
            className="area-card"
            type="button"
            aria-pressed={selectedAreaGroup?.area.id === group.area.id}
            onClick={() => onSelectArea(group.area.id)}
            style={areaColorStyle(group.area.color)}
          >
            <span className="area-swatch" />
            <span>
              <strong>{group.area.label}</strong>
              <small>
                {group.ships.length} ship{group.ships.length === 1 ? "" : "s"} - {group.bookingCount} active
                booking products
              </small>
            </span>
            <span className="area-fleet">
              {group.ships.map(({ ship }) => (
                <i key={ship.id}>{ship.name}</i>
              ))}
            </span>
          </button>
        ))}
      </section>

      <section className="detail-panel" aria-label="Selected region detail">
        {selectedAreaGroup ? (
          <>
            <div className="focus-heading">
              <span className="eyebrow">Selected Region</span>
              <h2>{selectedAreaGroup.area.label}</h2>
              <p>
                {selectedAreaGroup.ships
                  .map(({ ship, status }) => `${ship.name}${status !== "bookable" ? ` (${statusLabel(status)})` : ""}`)
                  .join(", ")}
              </p>
            </div>
            <div className="booking-list">
              {selectedAreaBookings.map((deployment) => {
                const ship = shipById.get(deployment.shipId);
                return (
                  <a key={deployment.id} href={deployment.sourceUrl} target="_blank" rel="noreferrer">
                    <span>
                      <strong>{ship?.name ?? deployment.shipId}</strong>
                      <small>{deployment.label}</small>
                      <em>{bookingWindowLabel(deployment)}</em>
                    </span>
                    <ExternalLink size={14} />
                  </a>
                );
              })}
            </div>
          </>
        ) : (
          <div className="empty-focus">
            <Search size={18} />
            Pick a region to see ships and booking evidence.
          </div>
        )}
      </section>
    </>
  );
}
