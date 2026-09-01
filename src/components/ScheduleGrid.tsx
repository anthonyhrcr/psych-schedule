import { useState } from "react";
import {
  ALL_SLOTS,
  Lang,
  SchedulePayload,
  LunchConfig,
  formatLunchLabel,
  isLunchSlot,
  isSameDay,
  isWeekend,
  toISODate,
  weekdayShort,
  weekdayLong,
} from "../lib/schedule";
import { SlotCell } from "./SlotCell";
import { LunchConfigPopover } from "./LunchConfigPopover";
import { t } from "../i18n";

type Props = {
  payload: SchedulePayload;
  days: Date[];
  lang: Lang;
  getLunch: (date: Date) => LunchConfig;
  onChange: (dateISO: string, slotIndex: number, value: string) => void;
  selection: {
    anchor: { dateISO: string; slotIndex: number } | null;
    selected: Set<string>;
  };
  onShiftClick: (dateISO: string, slotIndex: number) => void;
  onClearSelection: () => void;
  onLunchSave: (weekday: number, config: LunchConfig) => void;
  onLunchReset: (weekday: number) => void;
  suggestionsId?: string;
};

const cellKey = (dateISO: string, slotIndex: number) => `${dateISO}:${slotIndex}`;

export function ScheduleGrid({
  payload,
  days,
  lang,
  getLunch,
  onChange,
  selection,
  onShiftClick,
  onClearSelection,
  onLunchSave,
  onLunchReset,
  suggestionsId,
}: Props) {
  const [openLunchFor, setOpenLunchFor] = useState<number | null>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="schedule-grid" role="grid" aria-label={t(lang, "appTitle")}>
      <div className="grid-header" role="row">
        <div className="time-col header" role="columnheader"></div>
        {days.map((date) => {
          const weekday = date.getDay();
          const isOpen = openLunchFor === weekday;
          const lunch = getLunch(date);
          const classes = [
            "day-header",
            isWeekend(date) ? "weekend" : "",
            isSameDay(date, today) ? "today" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div className={classes} role="columnheader" key={toISODate(date)}>
              <div className="day-header-row">
                <span className="day-header-name">{weekdayShort(date, lang)}</span>
                <span className="day-header-date">{date.getDate()}</span>
              </div>
              <button
                type="button"
                className="lunch-handle"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenLunchFor(isOpen ? null : weekday);
                }}
                aria-label={`${t(lang, "lunchConfigTitle")} — ${weekdayLong(date, lang)}`}
                title={formatLunchLabel(lunch, lang)}
              >
                <span className="lunch-handle-icon" aria-hidden="true">🍽</span>
                <span className="lunch-handle-text">
                  {formatHourLabel(lunch.startHour)}–{formatHourLabel(lunch.endHour)}
                </span>
              </button>
              {isOpen && (
                <div className="lunch-popover-wrap">
                  <LunchConfigPopover
                    title={weekdayLong(date, lang)}
                    config={lunch}
                    lang={lang}
                    onSave={(c) => {
                      onLunchSave(weekday, c);
                      setOpenLunchFor(null);
                    }}
                    onReset={() => {
                      onLunchReset(weekday);
                      setOpenLunchFor(null);
                    }}
                    onClose={() => setOpenLunchFor(null)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid-body">
        {ALL_SLOTS.map((time, slotIndex) => (
          <div className="slot-row" role="row" key={time}>
            <div className="time-col" role="rowheader">
              {time}
            </div>
            {days.map((date) => {
              const dateISO = toISODate(date);
              const key = cellKey(dateISO, slotIndex);
              const lunch = getLunch(date);
              return (
                <SlotCell
                  key={dateISO}
                  dateISO={dateISO}
                  slotIndex={slotIndex}
                  time={time}
                  patientName={payload[dateISO]?.[slotIndex] ?? ""}
                  lang={lang}
                  isSelected={selection.selected.has(key)}
                  isLunch={isLunchSlot(slotIndex, lunch)}
                  isWeekend={isWeekend(date)}
                  lunchLabel={formatLunchLabel(lunch, lang)}
                  suggestionsId={suggestionsId}
                  onChange={onChange}
                  onShiftClick={onShiftClick}
                  onClearSelection={onClearSelection}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatHourLabel(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}
