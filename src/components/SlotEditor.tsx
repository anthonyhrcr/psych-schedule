import { useEffect, useRef, useState } from "react";
import { Lang } from "../lib/schedule";
import { t } from "../i18n";

type Props = {
  initialValue: string;
  lang: Lang;
  suggestionsId?: string;
  onSave: (value: string) => void;
  onCancel: () => void;
};

/**
 * Inline editor that appears in place of a slot cell. Keeps focus on mount,
 * saves on Enter / blur, cancels on Escape.
 */
export function SlotEditor({ initialValue, lang, suggestionsId, onSave, onCancel }: Props) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const commit = () => {
    onSave(value);
  };

  return (
    <div className="cell-editor" role="group" aria-label={t(lang, "editPatient")}>
      <input
        ref={inputRef}
        type="text"
        className="cell-input"
        value={value}
        placeholder={t(lang, "patientPlaceholder")}
        list={suggestionsId}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        onBlur={commit}
        maxLength={80}
      />
    </div>
  );
}
