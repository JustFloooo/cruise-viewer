import { ShipWheel } from "lucide-react";
import { formatDisplayDate } from "../data/dateMath";
import { dataSource } from "../data/generatedData";
import type { ActiveShip, AreaGroup, CruiseShip, Deployment, ShipAreaWindow } from "../data/types";
import { RegionExplorer } from "./RegionExplorer";
import { ShipExplorer } from "./ShipExplorer";
import { TimePanel } from "./TimePanel";

type ExploreMode = "regions" | "ships";

type ExplorerPanelProps = {
  selectedDay: number;
  selectedDate: string;
  isPlaying: boolean;
  onShiftDate: (days: number) => void;
  onTogglePlay: () => void;
  onSetDay: (day: number) => void;
  exploreMode: ExploreMode;
  onSetExploreMode: (mode: ExploreMode) => void;
  areaGroups: AreaGroup[];
  selectedAreaGroup: AreaGroup | undefined;
  selectedAreaBookings: Deployment[];
  onSelectArea: (areaId: string) => void;
  activeShips: ActiveShip[];
  selectedShipId: string | undefined;
  selectedShip: CruiseShip | undefined;
  selectedShipJourney: ShipAreaWindow[];
  onSelectShip: (ship: CruiseShip) => void;
};

export function ExplorerPanel({
  selectedDay,
  selectedDate,
  isPlaying,
  onShiftDate,
  onTogglePlay,
  onSetDay,
  exploreMode,
  onSetExploreMode,
  areaGroups,
  selectedAreaGroup,
  selectedAreaBookings,
  onSelectArea,
  activeShips,
  selectedShipId,
  selectedShip,
  selectedShipJourney,
  onSelectShip,
}: ExplorerPanelProps) {
  return (
    <aside className="explorer-panel" aria-label="Cruise explorer">
      <header className="panel-header">
        <div className="brand-block">
          <span className="brand-mark">
            <ShipWheel size={22} />
          </span>
          <div>
            <h1>Cruise Viewer</h1>
            <p>Mein Schiff seasonal atlas</p>
          </div>
        </div>
        <div className="panel-stats">
          <span>{activeShips.length} ships placed</span>
          <span>{areaGroups.length} regions</span>
          <span>{dataSource.loadedTrips} trips</span>
        </div>
      </header>

      <TimePanel
        selectedDay={selectedDay}
        selectedDate={selectedDate}
        isPlaying={isPlaying}
        onShiftDate={onShiftDate}
        onTogglePlay={onTogglePlay}
        onSetDay={onSetDay}
      />

      <section className="panel-intro">
        <span className="eyebrow">Snapshot</span>
        <h2>{formatDisplayDate(selectedDate)}</h2>
        <p>Use regions for the fleet overview, or switch to ships for one vessel's journey.</p>
      </section>

      <div className="explore-tabs" role="tablist" aria-label="Explorer mode">
        <button
          type="button"
          role="tab"
          aria-selected={exploreMode === "regions"}
          onClick={() => onSetExploreMode("regions")}
        >
          Regions
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={exploreMode === "ships"}
          onClick={() => onSetExploreMode("ships")}
        >
          Ships
        </button>
      </div>

      <div className="panel-scroll">
        {exploreMode === "regions" ? (
          <RegionExplorer
            areaGroups={areaGroups}
            selectedAreaGroup={selectedAreaGroup}
            selectedAreaBookings={selectedAreaBookings}
            onSelectArea={onSelectArea}
          />
        ) : (
          <ShipExplorer
            activeShips={activeShips}
            selectedShipId={selectedShipId}
            selectedShip={selectedShip}
            selectedShipJourney={selectedShipJourney}
            selectedDate={selectedDate}
            onSelectShip={onSelectShip}
          />
        )}
      </div>
    </aside>
  );
}
