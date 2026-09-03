import { useCallback, useState } from "react";
import { Lang } from "./lib/schedule";
import { Page } from "./lib/navigation";
import { loadLanguage, saveLanguage } from "./lib/storage";
import { HomePage } from "./pages/HomePage";
import { AgendaPage } from "./pages/AgendaPage";
import { PatientsPage } from "./pages/PatientsPage";
import { EvolutionPage } from "./pages/EvolutionPage";
import { HistoryPage } from "./pages/HistoryPage";
import { t } from "./i18n";
import "./styles.css";

export default function App() {
  const [lang, setLang] = useState<Lang>(() => loadLanguage());
  const [page, setPage] = useState<Page>("home");

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === "en" ? "pt" : "en";
      saveLanguage(next);
      return next;
    });
  }, []);

  const goHome = useCallback(() => setPage("home"), []);

  return (
    <div className="app">
      <div className="container">
        {page === "home" && (
          <HomePage lang={lang} onToggleLang={toggleLang} onNavigate={setPage} />
        )}
        {page === "agenda" && (
          <AgendaPage lang={lang} onToggleLang={toggleLang} onBack={goHome} />
        )}
        {page === "patients" && (
          <PatientsPage lang={lang} onToggleLang={toggleLang} onBack={goHome} />
        )}
        {page === "evolution" && (
          <EvolutionPage
            lang={lang}
            onToggleLang={toggleLang}
            onBack={goHome}
            onGoToPatients={() => setPage("patients")}
          />
        )}
        {page === "history" && (
          <HistoryPage lang={lang} onToggleLang={toggleLang} onBack={goHome} />
        )}

        <footer className="footer">
          <p>{t(lang, "footerNote")}</p>
        </footer>
      </div>
    </div>
  );
}
