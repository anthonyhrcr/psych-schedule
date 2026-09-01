import { useEffect, useRef, useState } from "react";
import { Lang, LunchConfig, formatHour } from "../lib/schedule";
import { t } from "../i18n";

type Props = {
  title: string;
  config: LunchConfig;
  lang: Lang;
  onSave: (config: LunchConfig) => void;
  onReset: () => void;
  onClose: () => void;
};

/**
 * Inline popover for editing one weekday's lunch break. Uses native time
 * inputs picked to the hour for simplicity. Returns valid hour-only config.
 */
export function LunchConfigPopover({ title, config, lang, onSave, onReset, onClose }: Props) {
  const [start, setStart] = useState(formatHour(config.startHour));
  const [end, setEnd] = useState(formatHour(config.endHour));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleSave = () => {
    const startHour = parseInt(start.split(":")[0] ?? "12", 10);
    const endHour = parseInt(end.split(":")[0] ?? "13", 10);
    if (Number.isFinite(startHour) && Number.isFinite(endHour) && endHour > startHour) {
      onSave({ startHour, endHour });
    }
  };

  return (
    <div className="lunch-popover" ref={ref}>
      <div className="lunch-popover-title">{t(lang, "lunchConfigTitle")}</div>
      <div className="lunch-popover-scope">{title}</div>
      <div className="lunch-popover-row">
        <label className="lunch-popover-label">
          {t(lang, "lunchStart")}
          <input
            type="time"
            className="lunch-popover-input"
            value={start}
            step="3600"
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="lunch-popover-label">
          {t(lang, "lunchEnd")}
          <input
            type="time"
            className="lunch-popover-input"
            value={end}
            step="3600"
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>
      <p className="lunch-popover-hint">{t(lang, "lunchHint")}</p>
      <div className="lunch-popover-actions">
        <button type="button" className="lunch-popover-reset" onClick={onReset}>
          {t(lang, "lunchReset")}
        </button>
        <button type="button" className="lunch-popover-save" onClick={handleSave}>
          {t(lang, "save")}
        </button>
      </div>
    </div>
  );
}
