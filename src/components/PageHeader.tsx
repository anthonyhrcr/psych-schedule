import { Lang } from "../lib/schedule";
import { t } from "../i18n";

type Props = {
  title: string;
  subtitle?: string;
  lang: Lang;
  onToggleLang: () => void;
  onBack?: () => void;
};

export function PageHeader({ title, subtitle, lang, onToggleLang, onBack }: Props) {
  return (
    <header className="app-header">
      {onBack && (
        <button type="button" className="back-link" onClick={onBack}>
          ← {t(lang, "backToHome")}
        </button>
      )}
      <div className="app-header-row">
        <h1 className="app-title">{title}</h1>
        <button type="button" className="lang-toggle" onClick={onToggleLang}>
          {t(lang, "languageToggle")}
        </button>
      </div>
      {subtitle && <p className="app-subtitle">{subtitle}</p>}
    </header>
  );
}
