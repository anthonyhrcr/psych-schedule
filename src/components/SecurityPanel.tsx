import { FormEvent, useState } from "react";
import { Lang } from "../lib/schedule";
import { enablePasscode, disablePasscode, hasPasscode } from "../lib/storage";
import { t } from "../i18n";

type Props = {
  lang: Lang;
  onLock: () => void;
  onChanged: () => void;
};

/**
 * Lives directly under the backup button on purpose: turning the lock on is
 * the one action here that can cost the user everything, so the safeguard
 * sits immediately above it.
 */
export function SecurityPanel({ lang, onLock, onChanged }: Props) {
  const [locked, setLocked] = useState(() => hasPasscode());
  const [opening, setOpening] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setOpening(false);
    setPasscode("");
    setConfirm("");
    setAcknowledged(false);
    setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (passcode.length < 6) {
      setError(t(lang, "passcodeTooShort"));
      return;
    }
    if (passcode !== confirm) {
      setError(t(lang, "passcodeMismatch"));
      return;
    }
    setBusy(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 0));
    await enablePasscode(passcode);
    setBusy(false);
    setLocked(true);
    reset();
    onChanged();
  };

  const turnOff = () => {
    disablePasscode();
    setLocked(false);
    onChanged();
  };

  return (
    <div className="security-panel">
      <h2 className="section-heading">{t(lang, "securityTitle")}</h2>

      {locked ? (
        <>
          <p className="security-state">{t(lang, "lockOn")}</p>
          <div className="backup-actions">
            <button type="button" className="primary-btn" onClick={onLock}>
              {t(lang, "lockNow")}
            </button>
            <button type="button" className="nav-btn" onClick={turnOff}>
              {t(lang, "removePasscode")}
            </button>
          </div>
          <p className="backup-hint">{t(lang, "removePasscodeHint")}</p>
        </>
      ) : !opening ? (
        <>
          <p className="security-state">{t(lang, "lockOff")}</p>
          <button type="button" className="nav-btn" onClick={() => setOpening(true)}>
            {t(lang, "setPasscode")}
          </button>
          <p className="backup-hint">{t(lang, "setPasscodeHint")}</p>
        </>
      ) : (
        <form className="lock-form" onSubmit={submit}>
          <p className="notice-warn">{t(lang, "passcodeWarning")}</p>

          <label className="field-label" htmlFor="new-passcode">
            {t(lang, "newPasscode")}
          </label>
          <input
            id="new-passcode"
            type="password"
            className="text-input"
            autoComplete="new-password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
          />

          <label className="field-label" htmlFor="confirm-passcode">
            {t(lang, "confirmPasscode")}
          </label>
          <input
            id="confirm-passcode"
            type="password"
            className="text-input"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            <span>{t(lang, "backupConfirm")}</span>
          </label>

          {error && <p className="notice-error">{error}</p>}

          <div className="backup-actions">
            <button
              type="submit"
              className="primary-btn"
              disabled={!acknowledged || busy}
            >
              {busy ? t(lang, "encrypting") : t(lang, "turnOnLock")}
            </button>
            <button type="button" className="nav-btn" onClick={reset}>
              {t(lang, "cancel")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
