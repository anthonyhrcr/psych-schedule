import { FormEvent, useEffect, useState } from "react";
import { Lang } from "../lib/schedule";
import {
  signIn,
  setUpKeys,
  recoverWithKey,
  requestPasswordReset,
  completePasswordReset,
  isPasswordRecoveryLink,
  onPasswordRecovery,
} from "../lib/auth";
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
  | { name: "recovery" }
  | { name: "forgot" }
  | { name: "forgot-sent" }
  | { name: "reset" };

/**
 * Sign-in has no registration form by design: accounts are created from the
 * Supabase dashboard, so there is nothing here for an uninvited visitor to use.
 *
 * Three things can happen after the password is accepted. Normally the master
 * key unwraps and we are done. A user invited from the dashboard has no key
 * material yet and goes to first-run setup. A password that no longer unwraps
 * the key means it was reset, and the recovery key is the way back.
 *
 * The reset path is deliberately honest about its limits: the email proves who
 * you are to the server, which can change a password but cannot decrypt a
 * record. That is why the recovery key is asked for on the same form as the
 * new password, and why the warning appears before the email is sent rather
 * than after, when it would be too late to be useful.
 */
export function AccountGate({ lang, onToggleLang, onSignedIn }: Props) {
  const [stage, setStage] = useState<Stage>({ name: "sign-in" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryInput, setRecoveryInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  // Arriving from a reset email: the link carries a session, not a key.
  useEffect(() => {
    if (isPasswordRecoveryLink()) setStage({ name: "reset" });
    return onPasswordRecovery(() => setStage({ name: "reset" }));
  }, []);

  const goToSignIn = () => {
    setStage({ name: "sign-in" });
    setError(null);
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setRecoveryInput("");
  };

  const submitForgot = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const ok = await requestPasswordReset(email.trim());
    setBusy(false);
    // The confirmation says the same thing whether or not the address has an
    // account, so this form cannot be used to find out who holds one.
    if (ok) setStage({ name: "forgot-sent" });
    else setError(t(lang, "resetRequestFailed"));
  };

  const submitReset = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (newPassword.length < 8) {
      setError(t(lang, "passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t(lang, "passwordsDiffer"));
      return;
    }
    setBusy(true);
    setError(null);
    const result = await completePasswordReset(recoveryInput.trim(), newPassword);
    setBusy(false);

    switch (result.status) {
      case "ok":
        onSignedIn();
        return;
      case "bad-key":
        setError(t(lang, "resetBadKey"));
        return;
      case "no-session":
        setError(t(lang, "resetNoSession"));
        return;
      case "failed":
        setError(t(lang, "resetFailed"));
    }
  };

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
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setStage({ name: "forgot" });
                setError(null);
              }}
            >
              {t(lang, "forgotPasswordLink")}
            </button>
            <p className="backup-hint">{t(lang, "inviteOnlyHint")}</p>
          </>
        )}

        {stage.name === "forgot" && (
          <>
            <p className="app-subtitle">{t(lang, "forgotSubtitle")}</p>
            <p className="notice-warn">{t(lang, "forgotWarning")}</p>
            <form className="lock-form" onSubmit={submitForgot}>
              <label className="field-label" htmlFor="reset-email">
                {t(lang, "emailLabel")}
              </label>
              <input
                id="reset-email"
                type="email"
                className="text-input"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="primary-btn" disabled={busy || !email.trim()}>
                {busy ? t(lang, "sending") : t(lang, "sendResetBtn")}
              </button>
            </form>
            <button type="button" className="link-btn" onClick={goToSignIn}>
              {t(lang, "backToSignIn")}
            </button>
          </>
        )}

        {stage.name === "forgot-sent" && (
          <>
            <p className="app-subtitle">{t(lang, "forgotSentSubtitle")}</p>
            <button type="button" className="link-btn" onClick={goToSignIn}>
              {t(lang, "backToSignIn")}
            </button>
          </>
        )}

        {stage.name === "reset" && (
          <>
            <p className="app-subtitle">{t(lang, "resetSubtitle")}</p>
            <form className="lock-form" onSubmit={submitReset}>
              <label className="field-label" htmlFor="new-password">
                {t(lang, "newPasswordLabel")}
              </label>
              <input
                id="new-password"
                type="password"
                className="text-input"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <label className="field-label" htmlFor="confirm-password">
                {t(lang, "confirmPasswordLabel")}
              </label>
              <input
                id="confirm-password"
                type="password"
                className="text-input"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <label className="field-label" htmlFor="reset-recovery-key">
                {t(lang, "recoveryKeyLabel")}
              </label>
              <input
                id="reset-recovery-key"
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
                disabled={busy || !newPassword || !confirmPassword || !recoveryInput.trim()}
              >
                {busy ? t(lang, "resetting") : t(lang, "resetBtn")}
              </button>
            </form>
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
