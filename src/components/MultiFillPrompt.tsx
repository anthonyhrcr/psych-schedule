import { useEffect, useRef, useState } from "react";
import { Lang } from "../lib/schedule";
import { t } from "../i18n";

type Props = {
  count: number;
  lang: Lang;
  suggestionsId?: string;
  onApply: (value: string) => void;
  onCancel: () => void;
};

/**
 * Floating prompt that appears when the user has a shift+click range selected.
 * Type a name and press Enter to fill all selected cells at once.
 */
export function MultiFillPrompt({ count, lang, suggestionsId, onApply, onCancel }: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commit = () => {
    onApply(value);
    setValue("");
  };

  return (
    <div className="multi-fill-prompt" role="dialog" aria-label={t(lang, "fillSelected")}>
      <div className="multi-fill-row">
        <span className="multi-fill-count">
          {count} {t(lang, "selectedSuffix")}
        </span>
        <input
          ref={inputRef}
          type="text"
          className="multi-fill-input"
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
          maxLength={80}
        />
        <button type="button" className="multi-fill-apply" onClick={commit} disabled={!value.trim()}>
          {t(lang, "save")}
        </button>
        <button type="button" className="multi-fill-cancel" onClick={onCancel}>
          {t(lang, "cancel")}
        </button>
      </div>
      <p className="multi-fill-hint">{t(lang, "fillSelectedHint")}</p>
    </div>
  );
}
