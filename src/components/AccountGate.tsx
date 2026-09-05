import { FormEvent, useState } from "react";
import { Lang } from "../lib/schedule";
import { signIn, setUpKeys, recoverWithKey } from "../lib/auth";
import { t } from "../i18n";

type Props = {
  lang: Lang;
  onToggleLang: () => void;
  onSignedIn: () => void;
};

type Stage =
  | { name: "sign-in" }
  | { name: "key-setup"; password: string }
  | { name: "show-recovery"; recoveryKey: string }
  | { name: "recovery" };

/**
 * Sign-in has no registration form by design: accounts are created from the
 * Supabase dashboard, so there is nothing here for an uninvited visitor to use.
 *
 * Three things can happen after the password is accepted. Normally the master
 * key unwraps and we are done. A user invited from the dashboard has no key
 * material yet and goes to first-run setup. A password that no longer unwraps
 * the key means it was reset, and the recovery key is the way back.
 */
export function AccountGate({ lang, onToggleLang, onSignedIn }: Props) {
  const [stage, setStage] = useState<Stage>({ name: "sign-in" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryInput, setRecoveryInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const submitSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await signIn(email.trim(), password);
    setBusy(false);

    switch (result.status) {
      case "ok":
        onSignedIn();
        return;
      case "needs-key-setup":
        setStage({ name: "key-setup", password });
        return;
      case "needs-recovery":
        setStage({ name: "recovery" });
        return;
      case "failed":
        setError(t(lang, "signInFailed"));
        setPassword("");
    }
  };

  const createKeys = async (pw: string) => {
    setBusy(true);
    setError(null);
    const recoveryKey = await setUpKeys(pw);
    setBusy(false);
    if (!recoveryKey) {
      setError(t(lang, "keySetupFailed"));
      return;
    }
    setStage({ name: "show-recovery", recoveryKey });
  };

  const submitRecovery = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const ok = await recoverWithKey(recoveryInput, password);
    setBusy(false);
    if (ok) onSignedIn();
    else setError(t(lang, "recoveryFailed"));
  };

  return (
    <div className="lock-screen">
      <div className="lock-card">
        <div className="app-header-row">
          <h1 className="app-title">{t(lang, "homeTitle")}</h1>
          <button type="button" className="lang-toggle" onClick={onToggleLang}>
            {t(lang, "languageToggle")}
          </button>
        </div>

        {stage.name === "sign-in" && (
          <>
            <p className="app-subtitle">{t(lang, "signInSubtitle")}</p>
            <form className="lock-form" onSubmit={submitSignIn}>
              <label className="field-label" htmlFor="email">
                {t(lang, "emailLabel")}
              </label>
              <input
                id="email"
                type="email"
                className="text-input"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="field-label" htmlFor="password">
                {t(lang, "passwordLabel")}
              </label>
              <input
                id="password"
                type="password"
                className="text-input"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="submit"
                className="primary-btn"
                disabled={busy || !email.trim() || !password}
              >
                {busy ? t(lang, "signingIn") : t(lang, "signInBtn")}
              </button>
            </form>
            <p className="backup-hint">{t(lang, "inviteOnlyHint")}</p>
          </>
        )}

        {stage.name === "key-setup" && (
          <>
            <p className="app-subtitle">{t(lang, "keySetupSubtitle")}</p>
            <p className="notice-warn">{t(lang, "keySetupWarning")}</p>
            <div className="backup-actions">
              <button
                type="button"
                className="primary-btn"
                disabled={busy}
                onClick={() => createKeys(stage.password)}
              >
                {busy ? t(lang, "encrypting") : t(lang, "keySetupBtn")}
              </button>
            </div>
          </>
        )}

        {stage.name === "show-recovery" && (
          <>
            <p className="app-subtitle">{t(lang, "recoveryShownSubtitle")}</p>
            <p className="recovery-key">{stage.recoveryKey}</p>
            <div className="backup-actions">
              <button
                type="button"
                className="nav-btn"
                onClick={() => void navigator.clipboard?.writeText(stage.recoveryKey)}
              >
                {t(lang, "copyRecoveryKey")}
              </button>
            </div>
            <p className="notice-warn">{t(lang, "recoveryShownWarning")}</p>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
              <span>{t(lang, "recoveryStored")}</span>
            </label>
            <div className="backup-actions">
              <button
                type="button"
                className="primary-btn"
                disabled={!acknowledged}
                onClick={onSignedIn}
              >
                {t(lang, "continueBtn")}
              </button>
            </div>
          </>
        )}

        {stage.name === "recovery" && (
          <>
            <p className="app-subtitle">{t(lang, "recoverySubtitle")}</p>
            <form className="lock-form" onSubmit={submitRecovery}>
              <label className="field-label" htmlFor="recovery-key">
                {t(lang, "recoveryKeyLabel")}
              </label>
              <input
                id="recovery-key"
                type="text"
                className="text-input"
                autoComplete="off"
                spellCheck={false}
                value={recoveryInput}
                onChange={(e) => setRecoveryInput(e.target.value)}
              />
              <button
                type="submit"
                className="primary-btn"
                disabled={busy || !recoveryInput.trim()}
              >
                {busy ? t(lang, "unlocking") : t(lang, "recoverBtn")}
              </button>
            </form>
          </>
        )}

        {error && <p className="notice-error">{error}</p>}
      </div>
    </div>
  );
}
