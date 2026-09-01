import { Lang } from "../lib/schedule";
import { DatePickerBar } from "./DatePickerBar";
import { t } from "../i18n";

type Props = {
  selectedDate: Date;
  days: Date[];
  lang: Lang;
  onPickDate: (date: Date) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onToggleLang: () => void;
  onBack?: () => void;
};

export function AppHeader({
  selectedDate,
  days,
  lang,
  onPickDate,
  onPrevious,
  onNext,
  onToday,
  onToggleLang,
  onBack,
}: Props) {
  return (
    <header className="app-header">
      {onBack && (
        <button type="button" className="back-link" onClick={onBack}>
          ← {t(lang, "backToHome")}
        </button>
      )}
      <div className="app-header-row">
        <h1 className="app-title">{t(lang, "appTitle")}</h1>
        <button type="button" className="lang-toggle" onClick={onToggleLang}>
          {t(lang, "languageToggle")}
        </button>
      </div>
      <p className="app-subtitle">{t(lang, "appSubtitle")}</p>

      <DatePickerBar
        selectedDate={selectedDate}
        days={days}
        lang={lang}
        onPickDate={onPickDate}
      />

      <div className="week-nav">
        <button type="button" className="nav-btn" onClick={onPrevious} aria-label={t(lang, "prevDays")}>
          ← <span className="nav-label">{t(lang, "prevDays")}</span>
        </button>
        <button type="button" className="today-btn" onClick={onToday}>
          {t(lang, "today")}
        </button>
        <button type="button" className="nav-btn" onClick={onNext} aria-label={t(lang, "nextDays")}>
          <span className="nav-label">{t(lang, "nextDays")}</span> →
        </button>
      </div>
    </header>
  );
}
