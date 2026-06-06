import { ArrowLeft, ArrowRight, CalendarDays, Pause, Play } from "lucide-react";
import { DATE_ANCHORS, END_DAY, START_DAY, STEP_DAYS } from "../constants";
import { formatDisplayDate, toUtcDay } from "../data/dateMath";
import { monthKey } from "../lib/timeline";

type TimePanelProps = {
  selectedDay: number;
  selectedDate: string;
  isPlaying: boolean;
  onShiftDate: (days: number) => void;
  onTogglePlay: () => void;
  onSetDay: (day: number) => void;
};

export function TimePanel({
  selectedDay,
  selectedDate,
  isPlaying,
  onShiftDate,
  onTogglePlay,
  onSetDay,
}: TimePanelProps) {
  return (
    <section className="time-panel" aria-label="Timeline controls">
      <div className="time-main">
        <button type="button" className="icon-button" onClick={() => onShiftDate(-STEP_DAYS)} aria-label="Back two weeks">
          <ArrowLeft size={18} />
        </button>
        <button
          className="play-button"
          type="button"
          onClick={onTogglePlay}
          aria-label={isPlaying ? "Pause timeline" : "Play timeline"}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <div className="date-readout">
          <CalendarDays size={16} />
          <span>{formatDisplayDate(selectedDate)}</span>
        </div>
        <button type="button" className="icon-button" onClick={() => onShiftDate(STEP_DAYS)} aria-label="Forward two weeks">
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="timeline-scrub">
        <input
          type="range"
          min={START_DAY}
          max={END_DAY}
          step={STEP_DAYS}
          value={selectedDay}
          onChange={(event) => onSetDay(Number(event.target.value))}
          aria-label="Timeline date"
        />
      </div>

      <div className="jump-row">
        {DATE_ANCHORS.map((anchor) => (
          <button
            key={anchor.label}
            type="button"
            aria-pressed={monthKey(selectedDay) === anchor.date.slice(0, 7)}
            onClick={() => onSetDay(toUtcDay(anchor.date))}
          >
            {anchor.label}
          </button>
        ))}
      </div>
    </section>
  );
}
