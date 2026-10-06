import { Lang } from "../lib/schedule";
import { Page } from "../lib/navigation";
import { t } from "../i18n";

type Props = {
  lang: Lang;
  onOpen: (page: Page) => void;
};

/** The three documents, wherever someone might want them. */
export function LegalLinks({ lang, onOpen }: Props) {
  return (
    <p className="legal-links">
      <button type="button" className="link-btn" onClick={() => onOpen("privacy")}>
        {t(lang, "navPrivacy")}
      </button>
      <button type="button" className="link-btn" onClick={() => onOpen("terms")}>
        {t(lang, "navTerms")}
      </button>
      <button type="button" className="link-btn" onClick={() => onOpen("cookies")}>
        {t(lang, "navCookies")}
      </button>
    </p>
  );
}
