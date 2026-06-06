import { useMemo, useState, type WheelEvent } from "react";
import {
  DEFAULT_DAY,
  END_DAY,
  MAX_TIMELINE_ZOOM,
  MIN_TIMELINE_ZOOM,
  PLAYBACK_INTERVAL_MS,
  START_DAY,
  STEP_DAYS,
  TIMELINE_ZOOM_STEP,
} from "./constants";
import {
  cruiseAreas,
  dateInDeployment,
  deployments,
  fromUtcDay,
  shipAreaWindows,
  ships,
  sortedByStart,
  toUtcDay,
  type ActiveShip,
  type AreaGroup,
  type CruiseShip,
  type Deployment,
  type ShipAreaWindow,
} from "./data";
import { bookingAreaIdsFor, shipAssignmentForDate } from "./lib/selectors";
import { buildTimelineMonths, clamp, percentBetween, type TimelineGeometry } from "./lib/timeline";
import { usePlayback } from "./hooks/usePlayback";
import { ExplorerPanel } from "./components/ExplorerPanel";
import { MapWorkspace } from "./components/MapWorkspace";

export function App() {
  const [selectedDay, setSelectedDay] = useState(DEFAULT_DAY);
  const [selectedAreaId, setSelectedAreaId] = useState<string | undefined>();
  const [selectedShipId, setSelectedShipId] = useState<string | undefined>();
  const [exploreMode, setExploreMode] = useState<"regions" | "ships">("regions");
  const [workspaceMode, setWorkspaceMode] = useState<"timeline" | "map">("timeline");
  const [timelineZoom, setTimelineZoom] = useState(1);

  const selectedDate = fromUtcDay(selectedDay);

  const { isPlaying, setIsPlaying } = usePlayback(setSelectedDay, {
    startDay: START_DAY,
    endDay: END_DAY,
    stepDays: STEP_DAYS,
    intervalMs: PLAYBACK_INTERVAL_MS,
  });

  const timelineMonths = useMemo(() => buildTimelineMonths(START_DAY, END_DAY), []);
  const timelineStart = timelineMonths[0]?.startDay ?? START_DAY;
  const timelineEnd = END_DAY;
  const timelineWidth = Math.max(980, Math.round(timelineMonths.length * 92 * timelineZoom));
  const selectedDayOffset = percentBetween(selectedDay, timelineStart, timelineEnd);

  const activeDeployments = useMemo(() => {
    return deployments.filter((deployment) => dateInDeployment(selectedDate, deployment));
  }, [selectedDate]);

  const activeShips = useMemo<ActiveShip[]>(() => {
    return ships
      .map((ship) => shipAssignmentForDate(ship, selectedDate))
      .filter(Boolean)
      .sort((a, b) => a!.ship.name.localeCompare(b!.ship.name)) as ActiveShip[];
  }, [selectedDate]);

  const allAreaGroups = useMemo<AreaGroup[]>(() => {
    return cruiseAreas.map((area) => {
      const groupShips = activeShips.filter((activeShip) => activeShip.area.id === area.id);
      const bookingAreaIds = bookingAreaIdsFor(area.id);
      const bookingCount = activeDeployments.filter((deployment) => bookingAreaIds.has(deployment.areaId)).length;
      return {
        area,
        ships: groupShips,
        bookingCount,
      };
    });
  }, [activeDeployments, activeShips]);

  const activeAreaGroups = useMemo(() => {
    return allAreaGroups.filter((group) => group.ships.length > 0);
  }, [allAreaGroups]);

  const selectedAreaGroup = useMemo(() => {
    return (
      allAreaGroups.find((group) => group.area.id === selectedAreaId) ??
      allAreaGroups.find((group) => group.ships.some((activeShip) => activeShip.ship.id === selectedShipId)) ??
      activeAreaGroups[0] ??
      allAreaGroups[0]
    );
  }, [activeAreaGroups, allAreaGroups, selectedAreaId, selectedShipId]);

  const selectedShip = ships.find((ship) => ship.id === selectedShipId);

  const selectedShipJourney = useMemo<ShipAreaWindow[]>(() => {
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

  const selectedAreaBookings = useMemo<Deployment[]>(() => {
    if (!selectedAreaGroup) return [];
    const maxDay = selectedDay + 90;
    const bookingAreaIds = bookingAreaIdsFor(selectedAreaGroup.area.id);
    return sortedByStart(deployments)
      .filter((deployment) => bookingAreaIds.has(deployment.areaId))
      .filter((deployment) => toUtcDay(deployment.end) >= selectedDay)
      .filter((deployment) => toUtcDay(deployment.start) <= maxDay)
      .slice(0, 8);
  }, [selectedAreaGroup, selectedDay]);

  function shiftDate(days: number) {
    setSelectedDay((day) => Math.min(END_DAY, Math.max(START_DAY, day + days)));
  }

  function adjustTimelineZoom(amount: number) {
    setTimelineZoom((zoom) => Number(clamp(zoom + amount, MIN_TIMELINE_ZOOM, MAX_TIMELINE_ZOOM).toFixed(2)));
  }

  function handleTimelineWheel(event: WheelEvent<HTMLDivElement>) {
    if (event.altKey) {
      event.preventDefault();
      adjustTimelineZoom(event.deltaY < 0 ? TIMELINE_ZOOM_STEP : -TIMELINE_ZOOM_STEP);
      return;
    }

    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
      event.currentTarget.scrollLeft += event.deltaY;
    }
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

  function selectAreaWindow(areaWindow: ShipAreaWindow) {
    const windowStart = toUtcDay(areaWindow.start);
    const windowEnd = toUtcDay(areaWindow.end);
    const focusedDay = Math.min(windowEnd, Math.max(windowStart, selectedDay));

    setSelectedShipId(areaWindow.shipId);
    setSelectedAreaId(areaWindow.areaId);
    setSelectedDay(focusedDay);
    setExploreMode("ships");
  }

  function selectShortSequence(ship: CruiseShip, areaWindows: ShipAreaWindow[]) {
    const firstWindow = areaWindows[0];
    if (!firstWindow) return;
    const sequenceStart = toUtcDay(firstWindow.start);
    const sequenceEnd = toUtcDay(areaWindows[areaWindows.length - 1].end);

    setSelectedShipId(ship.id);
    setSelectedAreaId(firstWindow.areaId);
    setSelectedDay(Math.min(sequenceEnd, Math.max(sequenceStart, selectedDay)));
    setExploreMode("ships");
  }

  const timeline: TimelineGeometry = {
    months: timelineMonths,
    start: timelineStart,
    end: timelineEnd,
    width: timelineWidth,
    selectedDayOffset,
  };

  return (
    <main className="app-shell">
      <ExplorerPanel
        selectedDay={selectedDay}
        selectedDate={selectedDate}
        isPlaying={isPlaying}
        onShiftDate={shiftDate}
        onTogglePlay={() => setIsPlaying((value) => !value)}
        onSetDay={setSelectedDay}
        exploreMode={exploreMode}
        onSetExploreMode={setExploreMode}
        areaGroups={activeAreaGroups}
        selectedAreaGroup={selectedAreaGroup}
        selectedAreaBookings={selectedAreaBookings}
        onSelectArea={selectArea}
        activeShips={activeShips}
        selectedShipId={selectedShipId}
        selectedShip={selectedShip}
        selectedShipJourney={selectedShipJourney}
        onSelectShip={selectShip}
      />

      <MapWorkspace
        workspaceMode={workspaceMode}
        onSetWorkspaceMode={setWorkspaceMode}
        timelineZoom={timelineZoom}
        onAdjustZoom={adjustTimelineZoom}
        timeline={timeline}
        selectedDay={selectedDay}
        selectedDate={selectedDate}
        selectedShipId={selectedShipId}
        selectedAreaGroup={selectedAreaGroup}
        areaGroups={activeAreaGroups}
        activeShips={activeShips}
        onWheel={handleTimelineWheel}
        onSelectArea={selectArea}
        onSelectShip={selectShip}
        onSelectAreaWindow={selectAreaWindow}
        onSelectShortSequence={selectShortSequence}
      />
    </main>
  );
}
