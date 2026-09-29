import { FormEvent, useState } from "react";
import { Lang } from "../lib/schedule";
import { changePassword } from "../lib/auth";
import { t } from "../i18n";

type Props = {
  lang: Lang;
};

/**
 * Changing the password from inside the diary, which until now could only be
 * done by resetting it — and a reset needs the recovery key, so the easy case
 * demanded the hard remedy.
 *
 * The form stays closed until asked for: this sits in the same column as the
 * backup and the passcode lock, and only one of those should be shouting.
 */
export function PasswordPanel({ lang }: Props) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setOpen(false);
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (next.length < 8) {
      setError(t(lang, "passwordTooShort"));
      return;
    }
    if (next !== confirm) {
      setError(t(lang, "passwordsDiffer"));
      return;
    }
    setBusy(true);
    setError(null);
    const result = await changePassword(current, next);
    setBusy(false);

    switch (result.status) {
      case "ok":
        reset();
        setDone(true);
        return;
      case "bad-password":
        setError(t(lang, "currentPasswordWrong"));
        return;
      case "no-session":
        setError(t(lang, "resetNoSession"));
        return;
      case "failed":
        setError(t(lang, "changePasswordFailed"));
    }
  };

  return (
    <div className="security-panel">
      <h2 className="section-heading">{t(lang, "changePasswordTitle")}</h2>

      {!open ? (
        <>
          <button
            type="button"
            className="nav-btn"
            onClick={() => {
              setOpen(true);
              setDone(false);
            }}
          >
            {t(lang, "changePasswordOpen")}
          </button>
          <p className="backup-hint">{t(lang, "changePasswordHint")}</p>
          {done && <p className="notice-ok">{t(lang, "passwordChanged")}</p>}
        </>
      ) : (
        <form className="lock-form" onSubmit={submit}>
          <label className="field-label" htmlFor="current-password">
            {t(lang, "currentPasswordLabel")}
          </label>
          <input
            id="current-password"
            type="password"
            className="text-input"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />

          <label className="field-label" htmlFor="changed-password">
            {t(lang, "newPasswordLabel")}
          </label>
          <input
            id="changed-password"
            type="password"
            className="text-input"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />

          <label className="field-label" htmlFor="changed-password-confirm">
            {t(lang, "confirmPasswordLabel")}
          </label>
          <input
            id="changed-password-confirm"
            type="password"
            className="text-input"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          {error && <p className="notice-error">{error}</p>}

          <div className="backup-actions">
            <button
              type="submit"
              className="primary-btn"
              disabled={busy || !current || !next || !confirm}
            >
              {busy ? t(lang, "changing") : t(lang, "changePasswordBtn")}
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
