import { useState } from "react";
import { Lang } from "../lib/schedule";
import { t } from "../i18n";
import { SlotEditor } from "./SlotEditor";

type Props = {
  dateISO: string;
  slotIndex: number;
  time: string;
  patientName: string;
  lang: Lang;
  isSelected: boolean;
  isLunch: boolean;
  isWeekend: boolean;
  lunchLabel: string;
  suggestionsId?: string;
  onChange: (dateISO: string, slotIndex: number, value: string) => void;
  onShiftClick: (dateISO: string, slotIndex: number) => void;
  onClearSelection: () => void;
};

export function SlotCell({
  dateISO,
  slotIndex,
  time,
  patientName,
  lang,
  isSelected,
  isLunch,
  isWeekend,
  lunchLabel,
  suggestionsId,
  onChange,
  onShiftClick,
  onClearSelection,
}: Props) {
  const [editing, setEditing] = useState(false);
  const isBooked = patientName.length > 0;

  if (editing) {
    return (
      <div className="slot-cell editing" role="gridcell">
        <SlotEditor
          initialValue={patientName}
          lang={lang}
          suggestionsId={suggestionsId}
          onSave={(v) => {
            onChange(dateISO, slotIndex, v);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey && !isBooked) {
      e.preventDefault();
      onShiftClick(dateISO, slotIndex);
      return;
    }
    // Clears any active selection before opening the editor.
    onClearSelection();
    setEditing(true);
  };

  const classes = [
    "slot-cell",
    isBooked ? "booked" : "free",
    isLunch ? "lunch" : "",
    isWeekend ? "weekend" : "",
    isSelected ? "selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Lunch hours stay bookable — the break is a default, not a lock.
  const state = isBooked ? patientName : isLunch ? lunchLabel : t(lang, "emptySlot");

  return (
    <button
      type="button"
      className={classes}
      onClick={handleClick}
      aria-label={`${time} — ${state}`}
      role="gridcell"
    >
      {isBooked ? (
        <>
          {isLunch && (
            <span className="lunch-flag" aria-hidden="true" title={lunchLabel}>
              🍽
            </span>
          )}
          <span className="patient-name">{patientName}</span>
        </>
      ) : isLunch ? (
        <>
          <span className="lunch-icon" aria-hidden="true">🍽</span>
          <span className="lunch-cell-text">{t(lang, "lunchBreak")}</span>
          <span className="add-icon lunch-add" aria-hidden="true">+</span>
        </>
      ) : (
        <>
          <span className="add-icon" aria-hidden="true">+</span>
          <span className="free-label">{t(lang, "addPatient")}</span>
        </>
      )}
    </button>
  );
}
