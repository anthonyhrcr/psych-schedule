import { useCallback, useState } from "react";
import { Lang } from "./lib/schedule";
import { Page } from "./lib/navigation";
import {
  loadLanguage,
  saveLanguage,
  hasPasscode,
  isUnlocked,
  lock,
  isSignedIn,
  deviceDataCounts,
} from "./lib/storage";
import { isBackendConfigured } from "./lib/supabase";
import { LockScreen } from "./components/LockScreen";
import { AccountGate } from "./components/AccountGate";
import { MigrationPrompt } from "./components/MigrationPrompt";
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
  // Locked when a vault exists and this session has not opened it yet.
  const [locked, setLocked] = useState(() => hasPasscode() && !isUnlocked());
  // With a backend configured the app is account-based; without one it stays
  // exactly as it was, working on this device alone.
  const [signedIn, setSignedIn] = useState(() => isSignedIn());
  // Records still sitting on this device when an account is opened. Captured
  // at sign-in so the offer can be made before the diary looks empty.
  const [pendingUpload, setPendingUpload] = useState<{
    sessions: number;
    patients: number;
    notes: number;
  } | null>(null);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === "en" ? "pt" : "en";
      saveLanguage(next);
      return next;
    });
  }, []);

  const goHome = useCallback(() => setPage("home"), []);

  const lockNow = useCallback(() => {
    lock();
    setPage("home");
    setLocked(true);
  }, []);

  if (isBackendConfigured && !signedIn) {
    return (
      <div className="app">
        <AccountGate
          lang={lang}
          onToggleLang={toggleLang}
          onSignedIn={() => {
            const counts = deviceDataCounts();
            const hasLocal =
              counts.sessions > 0 || counts.patients > 0 || counts.notes > 0;
            setPendingUpload(hasLocal ? counts : null);
            setSignedIn(true);
          }}
        />
      </div>
    );
  }

  if (pendingUpload) {
    return (
      <div className="app">
        <MigrationPrompt
          lang={lang}
          counts={pendingUpload}
          onDone={() => setPendingUpload(null)}
        />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="app">
        <LockScreen
          lang={lang}
          onToggleLang={toggleLang}
          onUnlocked={() => setLocked(false)}
        />
      </div>
    );
  }

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
          <HistoryPage
            lang={lang}
            onToggleLang={toggleLang}
            onBack={goHome}
            onLock={lockNow}
          />
        )}

        <footer className="footer">
          <p>{t(lang, "footerNote")}</p>
        </footer>
      </div>
    </div>
  );
}
