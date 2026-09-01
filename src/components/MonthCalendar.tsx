import { useMemo } from "react";
import { isSameDay, getMonthGrid, formatMonthYear, Lang } from "../lib/schedule";

type Props = {
  selectedDate: Date;
  lang: Lang;
  onPickDate: (date: Date) => void;
};

const WEEKDAY_HEADERS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_HEADERS_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function MonthCalendar({ selectedDate, lang, onPickDate }: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const viewYear = selectedDate.getFullYear();
  const viewMonth = selectedDate.getMonth();
  const cells = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const headers = lang === "pt" ? WEEKDAY_HEADERS_PT : WEEKDAY_HEADERS_EN;

  const goPrevMonth = () => {
    const d = new Date(viewYear, viewMonth - 1, 1);
    onPickDate(d);
  };
  const goNextMonth = () => {
    const d = new Date(viewYear, viewMonth + 1, 1);
    onPickDate(d);
  };

  return (
    <div className="month-calendar" role="application" aria-label="Month calendar">
      <div className="month-header">
        <button type="button" className="month-nav" onClick={goPrevMonth} aria-label="Previous month">
          ‹
        </button>
        <div className="month-title">{formatMonthYear(selectedDate, lang)}</div>
        <button type="button" className="month-nav" onClick={goNextMonth} aria-label="Next month">
          ›
        </button>
      </div>
      <div className="month-weekdays">
        {headers.map((h) => (
          <div key={h} className="month-weekday">
            {h}
          </div>
        ))}
      </div>
      <div className="month-grid">
        {cells.map((cell) => {
          const isSelected = isSameDay(cell.date, selectedDate);
          const isToday = isSameDay(cell.date, today);
          const classes = [
            "month-cell",
            cell.inCurrentMonth ? "in-month" : "out-month",
            cell.isWeekend ? "weekend" : "",
            isSelected ? "selected" : "",
            isToday ? "today" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              type="button"
              key={cell.date.toISOString()}
              className={classes}
              onClick={() => onPickDate(cell.date)}
              title={formatMonthYear(cell.date, lang)}
            >
              <span className="month-cell-num">{cell.date.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
