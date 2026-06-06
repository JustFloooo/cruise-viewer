import { useEffect, useState } from "react";

type PlaybackOptions = {
  startDay: number;
  endDay: number;
  stepDays: number;
  intervalMs: number;
};

/**
 * Drives timeline auto-advance. While playing, advances the selected day by
 * `stepDays` every `intervalMs`, wrapping back to `startDay` once past `endDay`.
 */
export function usePlayback(
  setSelectedDay: (updater: (day: number) => number) => void,
  { startDay, endDay, stepDays, intervalMs }: PlaybackOptions,
) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = window.setInterval(() => {
      setSelectedDay((day) => (day >= endDay ? startDay : Math.min(day + stepDays, endDay)));
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [isPlaying, setSelectedDay, startDay, endDay, stepDays, intervalMs]);

  return { isPlaying, setIsPlaying };
}
