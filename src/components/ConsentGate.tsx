import { useState } from "react";
import { Lang } from "../lib/schedule";
import { Page } from "../lib/navigation";
import { LEGAL_VERSION } from "../legal/version";
import { recordAcceptance } from "../lib/consent";
import { LegalLinks } from "./LegalLinks";
import { t } from "../i18n";

type Props = {
  lang: Lang;
  onToggleLang: () => void;
  onAccepted: () => void;
  onOpenLegal: (page: Page) => void;
};

/**
 * Asked once, before the diary opens.
 *
 * The two sentences above the box are the ones that actually matter, so they
 * are on this screen rather than only in the documents: the professional is
 * the controller of their patients' records, and a lost password with a lost
 * recovery key means nobody can read them again.
 */
export function ConsentGate({ lang, onToggleLang, onAccepted, onOpenLegal }: Props) {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    if (busy) return;
    setBusy(true);
    await recordAcceptance(LEGAL_VERSION);
    setBusy(false);
    onAccepted();
  };

  return (
    <div className="lock-screen consent-gate">
      <div className="lock-card">
        <div className="app-header-row">
          <h1 className="app-title">{t(lang, "consentTitle")}</h1>
          <button type="button" className="lang-toggle" onClick={onToggleLang}>
            {t(lang, "languageToggle")}
          </button>
        </div>

        <p className="app-subtitle">{t(lang, "consentIntro")}</p>
        <p className="notice-warn">{t(lang, "consentControllerNote")}</p>
        <p className="notice-warn">{t(lang, "consentEncryptionNote")}</p>

        <LegalLinks lang={lang} onOpen={onOpenLegal} />

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span>{t(lang, "consentCheckbox")}</span>
        </label>

        <div className="backup-actions">
          <button
            type="button"
            className="primary-btn"
            disabled={!checked || busy}
            onClick={() => void accept()}
          >
            {t(lang, "consentAccept")}
          </button>
        </div>
      </div>
    </div>
  );
}
