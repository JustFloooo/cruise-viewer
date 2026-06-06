import { fromUtcDay, toUtcDay } from "../data/dateMath";
import type { ShipAreaWindow } from "../data/types";
import { monthLabel } from "./format";

const DAY_MS = 24 * 60 * 60 * 1000;

export function monthKey(day: number): string {
  return fromUtcDay(day).slice(0, 7);
}

export function monthStart(day: number): number {
  const date = new Date(day * DAY_MS);
  return toUtcDay(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));
}

export function addMonths(day: number, amount: number): number {
  const date = new Date(day * DAY_MS);
  return toUtcDay(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1)));
}

export function percentBetween(day: number, rangeStart: number, rangeEnd: number): number {
  return ((day - rangeStart) / Math.max(1, rangeEnd - rangeStart)) * 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function isMinorWindow(areaWindow: ShipAreaWindow): boolean {
  return areaWindow.status === "transfer" || areaWindow.status === "inferred-gap";
}

export type TimelineMonth = {
  key: string;
  label: string;
  startDay: number;
  endDay: number;
};

export function buildTimelineMonths(startDay: number, endDay: number): TimelineMonth[] {
  const months: TimelineMonth[] = [];
  for (let day = monthStart(startDay); day <= endDay; day = addMonths(day, 1)) {
    months.push({
      key: fromUtcDay(day),
      label: monthLabel(day),
      startDay: day,
      endDay: Math.min(addMonths(day, 1) - 1, endDay),
    });
  }
  return months;
}

export type TimelineDisplaySegment =
  | {
      type: "area-window";
      id: string;
      start: string;
      end: string;
      areaWindow: ShipAreaWindow;
    }
  | {
      type: "short-sequence";
      id: string;
      start: string;
      end: string;
      windows: ShipAreaWindow[];
    };

export function timelineSegmentsForShip(areaWindows: ShipAreaWindow[]): TimelineDisplaySegment[] {
  const segments: TimelineDisplaySegment[] = [];
  let minorRun: ShipAreaWindow[] = [];

  function flushMinorRun() {
    if (!minorRun.length) return;
    segments.push({
      type: "short-sequence",
      id: `${minorRun[0].id}-minor-${minorRun.length}`,
      start: minorRun[0].start,
      end: minorRun[minorRun.length - 1].end,
      windows: minorRun,
    });
    minorRun = [];
  }

  for (const areaWindow of areaWindows) {
    if (isMinorWindow(areaWindow)) {
      minorRun.push(areaWindow);
      continue;
    }

    flushMinorRun();
    segments.push({
      type: "area-window",
      id: areaWindow.id,
      start: areaWindow.start,
      end: areaWindow.end,
      areaWindow,
    });
  }

  flushMinorRun();
  return segments;
}


export type TimelineGeometry = {
  months: TimelineMonth[];
  start: number;
  end: number;
  width: number;
  selectedDayOffset: number;
};
