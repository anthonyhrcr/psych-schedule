import { FormEvent, useEffect, useRef, useState } from "react";
import { Lang } from "../lib/schedule";
import { unlock } from "../lib/storage";
import { t } from "../i18n";

type Props = {
  lang: Lang;
  onToggleLang: () => void;
  onUnlocked: () => void;
};

export function LockScreen({ lang, onToggleLang, onUnlocked }: Props) {
  const [passcode, setPasscode] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!passcode || busy) return;
    setBusy(true);
    setFailed(false);
    // Deriving the key takes a moment by design; yield so the UI can repaint.
    await new Promise((r) => setTimeout(r, 0));
    const ok = await unlock(passcode);
    setBusy(false);
    if (ok) {
      setPasscode("");
      onUnlocked();
    } else {
      setFailed(true);
      setPasscode("");
      inputRef.current?.focus();
    }
  };

  return (
    <div className="lock-screen">
      <div className="lock-card">
        <div className="app-header-row">
          <h1 className="app-title">{t(lang, "lockTitle")}</h1>
          <button type="button" className="lang-toggle" onClick={onToggleLang}>
            {t(lang, "languageToggle")}
          </button>
        </div>
        <p className="app-subtitle">{t(lang, "lockSubtitle")}</p>

        <form className="lock-form" onSubmit={submit}>
          <label className="field-label" htmlFor="passcode">
            {t(lang, "passcode")}
          </label>
          <input
            ref={inputRef}
            id="passcode"
            type="password"
            className="text-input"
            autoComplete="current-password"
            inputMode="text"
            value={passcode}
            onChange={(e) => {
              setPasscode(e.target.value);
              setFailed(false);
            }}
          />
          <button type="submit" className="primary-btn" disabled={!passcode || busy}>
            {busy ? t(lang, "unlocking") : t(lang, "unlockBtn")}
          </button>
        </form>

        {failed && <p className="notice-error">{t(lang, "wrongPasscode")}</p>}
        <p className="backup-hint">{t(lang, "lockHint")}</p>
      </div>
    </div>
  );
}
