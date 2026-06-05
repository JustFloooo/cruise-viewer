import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ExternalLink,
  Pause,
  Play,
  Search,
  ShipWheel,
} from "lucide-react";
import { CruiseMap, type ActiveShip, type AreaGroup } from "./components/CruiseMap";
import {
  areaForWindow,
  cruiseAreas,
  dataSource,
  deployments,
  shipAreaWindows,
  ships,
  viewerWindow,
  type CruiseShip,
  type Deployment,
  type ShipAreaWindow,
} from "./data/tuiDeployments";
import {
  dateInDeployment,
  formatDisplayDate,
  fromUtcDay,
  sortedByStart,
  toUtcDay,
} from "./data/dateMath";

const startDay = toUtcDay(viewerWindow.start);
const endDay = toUtcDay(viewerWindow.end);
const defaultDay = toUtcDay("2026-11-17");

const dateAnchors = [
  { label: "Jun 2026", date: "2026-06-15" },
  { label: "Nov 2026", date: "2026-11-17" },
  { label: "Jun 2027", date: "2027-06-15" },
  { label: "Nov 2027", date: "2027-11-15" },
  { label: "Mar 2028", date: "2028-03-15" },
];

function monthKey(day: number): string {
  return fromUtcDay(day).slice(0, 7);
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

function bestActiveWindow(areaWindowsForShip: ShipAreaWindow[]): ShipAreaWindow | undefined {
  return [...areaWindowsForShip].sort((a, b) => {
    const priority = activeWindowPriority(a) - activeWindowPriority(b);
    if (priority !== 0) return priority;
    return areaWindowLength(a) - areaWindowLength(b);
  })[0];
}

function activeShipForWindow(areaWindow: ShipAreaWindow): ActiveShip | undefined {
  const ship = ships.find((candidate) => candidate.id === areaWindow.shipId);
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

function bookingWindowLabel(deployment: Deployment): string {
  return `${formatDisplayDate(deployment.start)} - ${formatDisplayDate(deployment.end)}`;
}

function compactDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00Z`));
}

function statusLabel(status: ShipAreaWindow["status"]): string {
  if (status === "bookable") return "booking evidence";
  if (status === "sold-out") return "sold out";
  if (status === "transfer") return "transfer";
  return "inferred";
}

function shipAssignmentForDate(ship: CruiseShip, date: string): ActiveShip | undefined {
  const activeWindow = bestActiveWindow(
    shipAreaWindows
      .filter((areaWindow) => areaWindow.shipId === ship.id)
      .filter((areaWindow) => dateInDeployment(date, areaWindow)),
  );
  return activeWindow ? activeShipForWindow(activeWindow) : undefined;
}

export function App() {
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string | undefined>();
  const [selectedShipId, setSelectedShipId] = useState<string | undefined>();
  const [exploreMode, setExploreMode] = useState<"regions" | "ships">("regions");

  const selectedDate = fromUtcDay(selectedDay);

  const deploymentsByTripCode = useMemo(() => {
    return new Map(deployments.map((deployment) => [deployment.tripCode, deployment]));
  }, []);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = window.setInterval(() => {
      setSelectedDay((day) => (day >= endDay ? startDay : Math.min(day + 14, endDay)));
    }, 850);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const activeDeployments = useMemo(() => {
    return deployments.filter((deployment) => dateInDeployment(selectedDate, deployment));
  }, [selectedDate]);

  const activeShips = useMemo<ActiveShip[]>(() => {
    return ships
      .map((ship) => shipAssignmentForDate(ship, selectedDate))
      .filter(Boolean)
      .sort((a, b) => a!.ship.name.localeCompare(b!.ship.name)) as ActiveShip[];
  }, [selectedDate]);

  const areaGroups = useMemo<AreaGroup[]>(() => {
    return cruiseAreas
      .map((area) => {
        const groupShips = activeShips.filter((activeShip) => activeShip.area.id === area.id);
        const bookingCount = activeDeployments.filter((deployment) => deployment.areaId === area.id).length;
        return {
          area,
          ships: groupShips,
          bookingCount,
        };
      })
      .filter((group) => group.ships.length > 0);
  }, [activeDeployments, activeShips]);

  const selectedAreaGroup = useMemo(() => {
    return (
      areaGroups.find((group) => group.area.id === selectedAreaId) ??
      areaGroups.find((group) => group.ships.some((activeShip) => activeShip.ship.id === selectedShipId)) ??
      areaGroups[0]
    );
  }, [areaGroups, selectedAreaId, selectedShipId]);

  const selectedShip = ships.find((ship) => ship.id === selectedShipId);

  const selectedShipJourney = useMemo(() => {
    if (!selectedShip) return [];
    const shipWindows = sortedByStart(shipAreaWindows).filter(
      (areaWindow) => areaWindow.shipId === selectedShip.id,
    );
    const currentIndex = shipWindows.findIndex((areaWindow) =>
      dateInDeployment(selectedDate, areaWindow),
    );
    if (currentIndex >= 0) {
      return shipWindows.slice(Math.max(0, currentIndex - 2), currentIndex + 5);
    }
    return shipWindows.filter((areaWindow) => toUtcDay(areaWindow.start) >= selectedDay).slice(0, 7);
  }, [selectedDate, selectedDay, selectedShip]);

  const selectedAreaBookings = useMemo(() => {
    if (!selectedAreaGroup) return [];
    const maxDay = selectedDay + 90;
    return sortedByStart(deployments)
      .filter((deployment) => deployment.areaId === selectedAreaGroup.area.id)
      .filter((deployment) => toUtcDay(deployment.end) >= selectedDay)
      .filter((deployment) => toUtcDay(deployment.start) <= maxDay)
      .slice(0, 8);
  }, [selectedAreaGroup, selectedDay]);

  function shiftDate(days: number) {
    setSelectedDay((day) => Math.min(endDay, Math.max(startDay, day + days)));
  }

  function selectArea(areaId: string) {
    setSelectedAreaId(areaId);
    setSelectedShipId(undefined);
    setExploreMode("regions");
  }

  function selectShip(ship: CruiseShip) {
    setSelectedShipId((current) => (current === ship.id ? undefined : ship.id));
    const activeShip = activeShips.find((candidate) => candidate.ship.id === ship.id);
    if (activeShip) setSelectedAreaId(activeShip.area.id);
    setExploreMode("ships");
  }

  return (
    <main className="app-shell">
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

        <section className="time-panel" aria-label="Timeline controls">
          <div className="time-main">
            <button type="button" className="icon-button" onClick={() => shiftDate(-14)} aria-label="Back two weeks">
              <ArrowLeft size={18} />
            </button>
            <button
              className="play-button"
              type="button"
              onClick={() => setIsPlaying((value) => !value)}
              aria-label={isPlaying ? "Pause timeline" : "Play timeline"}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <div className="date-readout">
              <CalendarDays size={16} />
              <span>{formatDisplayDate(selectedDate)}</span>
            </div>
            <button type="button" className="icon-button" onClick={() => shiftDate(14)} aria-label="Forward two weeks">
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="timeline-scrub">
            <input
              type="range"
              min={startDay}
              max={endDay}
              step={14}
              value={selectedDay}
              onChange={(event) => setSelectedDay(Number(event.target.value))}
              aria-label="Timeline date"
            />
          </div>

          <div className="jump-row">
            {dateAnchors.map((anchor) => (
              <button
                key={anchor.label}
                type="button"
                aria-pressed={monthKey(selectedDay) === anchor.date.slice(0, 7)}
                onClick={() => setSelectedDay(toUtcDay(anchor.date))}
              >
                {anchor.label}
              </button>
            ))}
          </div>
        </section>

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
            onClick={() => setExploreMode("regions")}
          >
            Regions
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={exploreMode === "ships"}
            onClick={() => setExploreMode("ships")}
          >
            Ships
          </button>
        </div>

        <div className="panel-scroll">
          {exploreMode === "regions" ? (
            <>
              <section className="area-board" aria-label="Active regions">
                {areaGroups.map((group) => (
                  <button
                    key={group.area.id}
                    className="area-card"
                    type="button"
                    aria-pressed={selectedAreaGroup?.area.id === group.area.id}
                    onClick={() => selectArea(group.area.id)}
                    style={{ "--area-color": group.area.color } as React.CSSProperties}
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
                        const ship = ships.find((candidate) => candidate.id === deployment.shipId);
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
          ) : (
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
                      onClick={() => selectShip(ship)}
                      style={{ "--ship-color": indicatorColor } as React.CSSProperties}
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
                          .map((tripCode) => deploymentsByTripCode.get(tripCode))
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
                            style={{ "--area-color": area.color } as React.CSSProperties}
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
          )}
        </div>
      </aside>

      <section className="map-workspace" aria-label="Cruise region map">
        <CruiseMap
          areaGroups={areaGroups}
          selectedAreaId={selectedAreaGroup?.area.id}
          onAreaSelect={selectArea}
        />
      </section>
    </main>
  );
}
