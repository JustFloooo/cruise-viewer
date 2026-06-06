import type { WheelEventHandler } from "react";
import { CalendarDays, Map as MapIcon, ZoomIn, ZoomOut } from "lucide-react";
import { MAX_TIMELINE_ZOOM, MIN_TIMELINE_ZOOM, TIMELINE_ZOOM_STEP } from "../constants";
import { formatDisplayDate } from "../data/dateMath";
import type { ActiveShip, AreaGroup, CruiseShip, ShipAreaWindow } from "../data/types";
import type { TimelineGeometry } from "../lib/timeline";
import { CruiseMap } from "./CruiseMap";
import { FleetTimeline } from "./FleetTimeline";

type WorkspaceMode = "timeline" | "map";

type MapWorkspaceProps = {
  workspaceMode: WorkspaceMode;
  onSetWorkspaceMode: (mode: WorkspaceMode) => void;
  timelineZoom: number;
  onAdjustZoom: (amount: number) => void;
  timeline: TimelineGeometry;
  selectedDay: number;
  selectedDate: string;
  selectedShipId: string | undefined;
  selectedAreaGroup: AreaGroup | undefined;
  areaGroups: AreaGroup[];
  activeShips: ActiveShip[];
  onWheel: WheelEventHandler<HTMLDivElement>;
  onSelectArea: (areaId: string) => void;
  onSelectShip: (ship: CruiseShip) => void;
  onSelectAreaWindow: (areaWindow: ShipAreaWindow) => void;
  onSelectShortSequence: (ship: CruiseShip, areaWindows: ShipAreaWindow[]) => void;
};

export function MapWorkspace({
  workspaceMode,
  onSetWorkspaceMode,
  timelineZoom,
  onAdjustZoom,
  timeline,
  selectedDay,
  selectedDate,
  selectedShipId,
  selectedAreaGroup,
  areaGroups,
  activeShips,
  onWheel,
  onSelectArea,
  onSelectShip,
  onSelectAreaWindow,
  onSelectShortSequence,
}: MapWorkspaceProps) {
  return (
    <section className="map-workspace" data-mode={workspaceMode} aria-label="Cruise atlas workspace">
      <header className="workspace-header">
        <div>
          <span className="eyebrow">{workspaceMode === "timeline" ? "Fleet Timeline" : "Region Map"}</span>
          <h2>{workspaceMode === "timeline" ? "Area windows" : "Fleet geography"}</h2>
          <p>
            {workspaceMode === "timeline"
              ? "Scan the fleet by month, then click a block to inspect that ship and region."
              : "Use the map for spatial context around the selected date and active regions."}
          </p>
        </div>
        <div className="workspace-actions">
          <div className="workspace-switch" role="tablist" aria-label="Workspace view">
            <button
              type="button"
              role="tab"
              aria-selected={workspaceMode === "timeline"}
              onClick={() => onSetWorkspaceMode("timeline")}
            >
              <CalendarDays size={15} />
              Timeline
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={workspaceMode === "map"}
              onClick={() => onSetWorkspaceMode("map")}
            >
              <MapIcon size={15} />
              Map
            </button>
          </div>
          <div className="workspace-date-chip">
            <CalendarDays size={15} />
            <span>{formatDisplayDate(selectedDate)}</span>
          </div>
          {workspaceMode === "timeline" ? (
            <div className="timeline-zoom-control" aria-label="Timeline zoom" title="Alt + mouse wheel zooms the timeline">
              <button
                type="button"
                onClick={() => onAdjustZoom(-TIMELINE_ZOOM_STEP)}
                disabled={timelineZoom <= MIN_TIMELINE_ZOOM}
                aria-label="Zoom timeline out"
              >
                <ZoomOut size={15} />
              </button>
              <span>{Math.round(timelineZoom * 100)}%</span>
              <button
                type="button"
                onClick={() => onAdjustZoom(TIMELINE_ZOOM_STEP)}
                disabled={timelineZoom >= MAX_TIMELINE_ZOOM}
                aria-label="Zoom timeline in"
              >
                <ZoomIn size={15} />
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <FleetTimeline
        timeline={timeline}
        selectedDay={selectedDay}
        selectedDate={selectedDate}
        selectedShipId={selectedShipId}
        selectedAreaGroup={selectedAreaGroup}
        activeShips={activeShips}
        onWheel={onWheel}
        onSelectArea={onSelectArea}
        onSelectShip={onSelectShip}
        onSelectAreaWindow={onSelectAreaWindow}
        onSelectShortSequence={onSelectShortSequence}
      />

      <section className="map-preview" aria-label="Cruise region map">
        <CruiseMap
          areaGroups={areaGroups}
          selectedAreaId={selectedAreaGroup?.area.id}
          onAreaSelect={onSelectArea}
        />
      </section>
    </section>
  );
}
