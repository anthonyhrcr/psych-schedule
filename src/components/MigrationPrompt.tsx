import { useState } from "react";
import { Lang } from "../lib/schedule";
import { uploadLocalData } from "../lib/auth";
import { t } from "../i18n";

type Props = {
  lang: Lang;
  counts: { sessions: number; patients: number; notes: number };
  onDone: () => void;
};

/**
 * Shown once, immediately after signing in on a device that still holds
 * local records. Without it the diary would look empty on first sign-in and
 * the old data would appear lost, when in fact it is simply still on the
 * device and not yet in the account.
 *
 * Skipping is safe and non-destructive: nothing local is ever deleted here,
 * so the offer can be taken later from History instead.
 */
export function MigrationPrompt({ lang, counts, onDone }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const upload = async () => {
    setBusy(true);
    setError(false);
    const result = await uploadLocalData();
    setBusy(false);
    if (result) onDone();
    else setError(true);
  };

  const summary = t(lang, "migrationCounts")
    .replace("{sessions}", String(counts.sessions))
    .replace("{patients}", String(counts.patients))
    .replace("{notes}", String(counts.notes));

  return (
    <div className="lock-screen">
      <div className="lock-card">
        <h1 className="app-title">{t(lang, "migrationTitle")}</h1>
        <p className="app-subtitle">{t(lang, "migrationSubtitle")}</p>

        <p className="migration-counts">{summary}</p>
        <p className="backup-hint">{t(lang, "migrationHint")}</p>

        {error && <p className="notice-error">{t(lang, "migrationFailed")}</p>}

        <div className="backup-actions">
          <button type="button" className="primary-btn" disabled={busy} onClick={upload}>
            {busy ? t(lang, "migrationUploading") : t(lang, "migrationUpload")}
          </button>
          <button type="button" className="nav-btn" disabled={busy} onClick={onDone}>
            {t(lang, "migrationSkip")}
          </button>
        </div>
      </div>
    </div>
  );
}
