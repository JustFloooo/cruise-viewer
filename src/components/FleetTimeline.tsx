import type { CSSProperties, WheelEventHandler } from "react";
import { areaForWindow, cruiseAreas } from "../data/areas";
import { shipAreaWindows } from "../data/areaWindows";
import { dateInDeployment, sortedByStart, toUtcDay } from "../data/dateMath";
import { deploymentByTripCode } from "../data/deployments";
import { ships } from "../data/ships";
import type { ActiveShip, AreaGroup, CruiseShip, ShipAreaWindow } from "../data/types";
import { compactDate, shortRouteLabel, statusLabel } from "../lib/format";
import { areaColorStyle } from "../lib/style";
import { percentBetween, timelineSegmentsForShip, type TimelineGeometry } from "../lib/timeline";

type FleetTimelineProps = {
  timeline: TimelineGeometry;
  selectedDay: number;
  selectedDate: string;
  selectedShipId: string | undefined;
  selectedAreaGroup: AreaGroup | undefined;
  activeShips: ActiveShip[];
  onWheel: WheelEventHandler<HTMLDivElement>;
  onSelectArea: (areaId: string) => void;
  onSelectShip: (ship: CruiseShip) => void;
  onSelectAreaWindow: (areaWindow: ShipAreaWindow) => void;
  onSelectShortSequence: (ship: CruiseShip, areaWindows: ShipAreaWindow[]) => void;
};

export function FleetTimeline({
  timeline,
  selectedDay,
  selectedDate,
  selectedShipId,
  selectedAreaGroup,
  activeShips,
  onWheel,
  onSelectArea,
  onSelectShip,
  onSelectAreaWindow,
  onSelectShortSequence,
}: FleetTimelineProps) {
  const {
    months: timelineMonths,
    start: timelineStart,
    end: timelineEnd,
    width: timelineWidth,
    selectedDayOffset,
  } = timeline;

  return (
    <section className="timeline-workspace" aria-label="Fleet area timeline">
      <div className="area-legend" aria-label="Area legend">
        {cruiseAreas.map((area) => (
          <button
            key={area.id}
            type="button"
            aria-pressed={selectedAreaGroup?.area.id === area.id}
            onClick={() => onSelectArea(area.id)}
            style={areaColorStyle(area.color)}
          >
            <span />
            {area.label}
          </button>
        ))}
      </div>

      <div className="timeline-frame" onWheel={onWheel}>
        <div
          className="timeline-grid"
          style={{ "--timeline-width": `${timelineWidth}px` } as CSSProperties}
        >
          <div className="timeline-row timeline-month-row">
            <div className="timeline-ship-cell timeline-corner">Ship</div>
            <div className="timeline-track">
              {timelineMonths.map((month) => (
                <div
                  key={month.key}
                  className="timeline-month"
                  style={{
                    left: `${percentBetween(month.startDay, timelineStart, timelineEnd)}%`,
                    width: `${percentBetween(month.endDay + 1, timelineStart, timelineEnd) -
                      percentBetween(month.startDay, timelineStart, timelineEnd)}%`,
                  }}
                >
                  {month.label}
                </div>
              ))}
              <span className="timeline-now" style={{ left: `${selectedDayOffset}%` }} />
            </div>
          </div>

          {ships.map((ship) => {
            const rowWindows = sortedByStart(shipAreaWindows).filter((areaWindow) => areaWindow.shipId === ship.id);
            const displaySegments = timelineSegmentsForShip(rowWindows);
            const activeShip = activeShips.find((candidate) => candidate.ship.id === ship.id);
            return (
              <div
                key={ship.id}
                className="timeline-row"
                data-selected={selectedShipId === ship.id}
              >
                <button
                  type="button"
                  className="timeline-ship-cell timeline-ship-button"
                  onClick={() => onSelectShip(ship)}
                >
                  <strong>{ship.name}</strong>
                  <small>{activeShip?.area.label ?? "No active window"}</small>
                </button>
                <div className="timeline-track">
                  {timelineMonths.map((month) => (
                    <span
                      key={`${ship.id}-${month.key}`}
                      className="timeline-month-line"
                      style={{ left: `${percentBetween(month.startDay, timelineStart, timelineEnd)}%` }}
                    />
                  ))}
                  <span className="timeline-now" style={{ left: `${selectedDayOffset}%` }} />
                  {displaySegments.map((segment) => {
                    const windowStart = Math.max(timelineStart, toUtcDay(segment.start));
                    const windowEnd = Math.min(timelineEnd, toUtcDay(segment.end));
                    if (windowEnd < timelineStart || windowStart > timelineEnd) return null;

                    if (segment.type === "short-sequence") {
                      const isActive = selectedDay >= windowStart && selectedDay <= windowEnd;

                      return (
                        <button
                          key={segment.id}
                          type="button"
                          className="timeline-segment"
                          data-status="short-sequence"
                          data-active={isActive}
                          title={`${ship.name}: short itinerary sequence, ${compactDate(segment.start)} - ${compactDate(
                            segment.end,
                          )}`}
                          onClick={() => onSelectShortSequence(ship, segment.windows)}
                          style={{
                            ...areaColorStyle("#7b8790"),
                            left: `${percentBetween(windowStart, timelineStart, timelineEnd)}%`,
                            width: `${Math.max(
                              0.65,
                              percentBetween(windowEnd + 1, timelineStart, timelineEnd) -
                                percentBetween(windowStart, timelineStart, timelineEnd),
                            )}%`,
                          }}
                        >
                          <span>Short itineraries</span>
                          <small>{segment.windows.length} windows</small>
                        </button>
                      );
                    }

                    const areaWindow = segment.areaWindow;
                    const area = areaForWindow(areaWindow);
                    const sourceDeployment = areaWindow.sourceTripCodes
                      .map((tripCode) => deploymentByTripCode.get(tripCode))
                      .find(Boolean);
                    const isActive = dateInDeployment(selectedDate, areaWindow);
                    const segmentLabel =
                      areaWindow.status === "short-trip"
                        ? shortRouteLabel(sourceDeployment, area.label)
                        : area.label;

                    return (
                      <button
                        key={areaWindow.id}
                        type="button"
                        className="timeline-segment"
                        data-status={areaWindow.status}
                        data-active={isActive}
                        title={`${ship.name}: ${area.label}, ${compactDate(areaWindow.start)} - ${compactDate(
                          areaWindow.end,
                        )} (${statusLabel(areaWindow.status)})`}
                        onClick={() => onSelectAreaWindow(areaWindow)}
                        style={{
                          ...areaColorStyle(area.color),
                          left: `${percentBetween(windowStart, timelineStart, timelineEnd)}%`,
                          width: `${Math.max(
                            0.65,
                            percentBetween(windowEnd + 1, timelineStart, timelineEnd) -
                              percentBetween(windowStart, timelineStart, timelineEnd),
                            )}%`,
                          }}
                      >
                        <span>{segmentLabel}</span>
                        <small>
                          {statusLabel(areaWindow.status)}
                          {sourceDeployment ? ` - ${areaWindow.sourceTripCodes.length}` : ""}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
