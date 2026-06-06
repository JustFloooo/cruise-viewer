import { toUtcDay, viewerWindow } from "./data";

// Timeline advances and scrubs in two-week steps.
export const STEP_DAYS = 14;
export const PLAYBACK_INTERVAL_MS = 850;

export const MIN_TIMELINE_ZOOM = 0.72;
export const MAX_TIMELINE_ZOOM = 2.4;
export const TIMELINE_ZOOM_STEP = 0.18;

export const START_DAY = toUtcDay(viewerWindow.start);
export const END_DAY = toUtcDay(viewerWindow.end);
export const DEFAULT_DAY = toUtcDay("2026-11-17");

export const DATE_ANCHORS = [
  { label: "Jun 2026", date: "2026-06-15" },
  { label: "Nov 2026", date: "2026-11-17" },
  { label: "Jun 2027", date: "2027-06-15" },
  { label: "Nov 2027", date: "2027-11-15" },
  { label: "Mar 2028", date: "2028-03-15" },
];
