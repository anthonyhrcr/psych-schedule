import { Lang } from "../lib/schedule";
import { MonthCalendar } from "./MonthCalendar";
import { DayStrip } from "./DayStrip";

type Props = {
  selectedDate: Date;
  days: Date[];
  lang: Lang;
  onPickDate: (date: Date) => void;
};

/**
 * Container combining the month calendar (left) and the five-day strip
 * (right). Both pickers sync — clicking a day in either re-centres the grid.
 */
export function DatePickerBar({ selectedDate, days, lang, onPickDate }: Props) {
  return (
    <div className="date-picker-bar">
      <MonthCalendar selectedDate={selectedDate} lang={lang} onPickDate={onPickDate} />
      <DayStrip days={days} selectedDate={selectedDate} lang={lang} onPickDate={onPickDate} />
    </div>
  );
}
