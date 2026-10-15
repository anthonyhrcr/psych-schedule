import { useRef, useState } from "react";
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
  /** True while a range is being built, so a plain tap extends it. */
  hasSelection: boolean;
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
  hasSelection,
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

  /**
   * Multi-fill on touch.
   *
   * There is no shift key on a phone, so the range that desktop builds with
   * shift+click was simply unreachable there. A long press starts the range
   * and a plain tap extends it, which lands on the same two-step model the
   * selection already had rather than inventing a second one.
   *
   * The press is abandoned as soon as the finger travels, so swiping the grid
   * sideways still scrolls it. No touch-action is set for the same reason.
   */
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);

  const cancelPress = () => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    pressOrigin.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "touch" || isBooked) return;
    longPressed.current = false;
    pressOrigin.current = { x: e.clientX, y: e.clientY };
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = null;
      longPressed.current = true;
      onShiftClick(dateISO, slotIndex);
    }, 450);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const origin = pressOrigin.current;
    if (!origin) return;
    if (Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > 10) cancelPress();
  };


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
    cancelPress();

    // The click the browser sends after a long press is not a second action.
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }

    if (e.shiftKey && !isBooked) {
      e.preventDefault();
      onShiftClick(dateISO, slotIndex);
      return;
    }

    // A range is open: a tap on a free hour extends it instead of editing.
    if (hasSelection && !isBooked) {
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
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
