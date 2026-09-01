import { useCallback, useEffect, useState } from "react";
import { Lang } from "../lib/schedule";
import { loadPatients } from "../lib/storage";
import { useSchedule } from "../hooks/useSchedule";
import { AppHeader } from "../components/AppHeader";
import { ScheduleGrid } from "../components/ScheduleGrid";
import { MultiFillPrompt } from "../components/MultiFillPrompt";

const cellKey = (dateISO: string, slotIndex: number) => `${dateISO}:${slotIndex}`;
export const PATIENT_SUGGESTIONS_ID = "patient-suggestions";

type Props = {
  lang: Lang;
  onToggleLang: () => void;
  onBack: () => void;
};

export function AgendaPage({ lang, onToggleLang, onBack }: Props) {
  const {
    selectedDate,
    days,
    dayKeys,
    payload,
    setCell,
    setManyCells,
    setLunchForWeekday,
    getLunch,
    goToDate,
    goToPrevious,
    goToNext,
    goToToday,
  } = useSchedule();

  const [anchor, setAnchor] = useState<{ dateISO: string; slotIndex: number } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [patientNames] = useState<string[]>(() => loadPatients().map((p) => p.name));

  const windowId = dayKeys.join("|");

  // Clear selection whenever the visible window moves.
  useEffect(() => {
    setAnchor(null);
    setSelected(new Set());
  }, [windowId]);

  // Clear selection on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selected.size > 0) {
        setAnchor(null);
        setSelected(new Set());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected.size]);

  const onShiftClick = useCallback(
    (dateISO: string, slotIndex: number) => {
      if (payload[dateISO]?.[slotIndex]) return; // booked cells: ignore
      if (!anchor) {
        setAnchor({ dateISO, slotIndex });
        setSelected(new Set([cellKey(dateISO, slotIndex)]));
        return;
      }
      // Same day → contiguous slot range from anchor.
      if (anchor.dateISO === dateISO) {
        const lo = Math.min(anchor.slotIndex, slotIndex);
        const hi = Math.max(anchor.slotIndex, slotIndex);
        const next = new Set<string>();
        for (let s = lo; s <= hi; s++) {
          if (!payload[dateISO]?.[s]) {
            next.add(cellKey(dateISO, s));
          }
        }
        setSelected(next);
        return;
      }
      // Different day → reset to a single-cell selection on the new cell.
      setAnchor({ dateISO, slotIndex });
      setSelected(new Set([cellKey(dateISO, slotIndex)]));
    },
    [anchor, payload]
  );

  const clearSelection = useCallback(() => {
    setAnchor(null);
    setSelected(new Set());
  }, []);

  const applyMultiFill = useCallback(
    (value: string) => {
      const entries: Array<[string, number]> = [];
      selected.forEach((key) => {
        const splitAt = key.lastIndexOf(":");
        entries.push([key.slice(0, splitAt), Number(key.slice(splitAt + 1))]);
      });
      setManyCells(entries, value);
      clearSelection();
    },
    [selected, setManyCells, clearSelection]
  );

  const selectedCount = selected.size;

  return (
    <>
      <AppHeader
        selectedDate={selectedDate}
        days={days}
        lang={lang}
        onPickDate={goToDate}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onToday={goToToday}
        onToggleLang={onToggleLang}
        onBack={onBack}
      />

      <main className="schedule-main">
        <datalist id={PATIENT_SUGGESTIONS_ID}>
          {patientNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <div className="schedule-scroll">
          <ScheduleGrid
            payload={payload}
            days={days}
            lang={lang}
            getLunch={getLunch}
            onChange={setCell}
            selection={{ anchor, selected }}
            onShiftClick={onShiftClick}
            onClearSelection={clearSelection}
            onLunchSave={(weekday, config) => setLunchForWeekday(weekday, config)}
            onLunchReset={(weekday) => setLunchForWeekday(weekday, null)}
            suggestionsId={PATIENT_SUGGESTIONS_ID}
          />
        </div>

        {selectedCount > 0 && (
          <MultiFillPrompt
            count={selectedCount}
            lang={lang}
            suggestionsId={PATIENT_SUGGESTIONS_ID}
            onApply={applyMultiFill}
            onCancel={clearSelection}
          />
        )}
      </main>
    </>
  );
}
