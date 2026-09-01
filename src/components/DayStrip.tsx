import { isSameDay, isWeekend, toISODate, weekdayShort, Lang } from "../lib/schedule";

type Props = {
  days: Date[];
  selectedDate: Date;
  lang: Lang;
  onPickDate: (date: Date) => void;
};

/**
 * The five days currently on screen. The selected day sits in the middle, so
 * picking a neighbour slides the window rather than jumping a whole week.
 */
export function DayStrip({ days, selectedDate, lang, onPickDate }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="day-strip" role="tablist" aria-label={days.length + " days"}>
      {days.map((d) => {
        const isSelected = isSameDay(d, selectedDate);
        const isToday = isSameDay(d, today);
        const classes = [
          "day-strip-chip",
          isSelected ? "selected" : "",
          isToday ? "today" : "",
          isWeekend(d) ? "weekend" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            type="button"
            key={toISODate(d)}
            className={classes}
            onClick={() => onPickDate(d)}
            role="tab"
            aria-selected={isSelected}
          >
            <span className="day-strip-weekday">{weekdayShort(d, lang)}</span>
            <span className="day-strip-day">{d.getDate()}</span>
            {isToday && <span className="day-strip-dot" aria-hidden="true"></span>}
          </button>
        );
      })}
    </div>
  );
}
