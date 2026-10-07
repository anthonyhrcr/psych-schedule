import { useCallback, useState } from "react";
import { Lang } from "./lib/schedule";
import { Page, isLegalPage } from "./lib/navigation";
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
import { LegalPage } from "./components/LegalPage";
import { LegalLinks } from "./components/LegalLinks";
import { privacy } from "./legal/privacy";
import { terms } from "./legal/terms";
import { cookies } from "./legal/cookies";
import { refunds } from "./legal/refunds";
import { LEGAL_VERSION } from "./legal/version";
import { ConsentGate } from "./components/ConsentGate";
import { LandingPage } from "./components/LandingPage";
import { hasAccepted } from "./lib/consent";
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
  // Asked once per device, after the diary is reachable but before it opens.
  const [accepted, setAccepted] = useState(() => hasAccepted(LEGAL_VERSION));
  // A visitor meets the landing page first; the sign-in form is one click
  // behind it rather than the front door.
  const [askingToSignIn, setAskingToSignIn] = useState(false);
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

  // Where ← goes back to when a document was opened from the sign-in screen
  // rather than from inside the diary.
  const [legalReturn, setLegalReturn] = useState<Page>("home");
  const openLegal = useCallback(
    (doc: Page) => {
      setLegalReturn(page);
      setPage(doc);
    },
    [page]
  );

  const lockNow = useCallback(async () => {
    // Await the flush so a change made moments before locking is not lost.
    await lock();
    setPage("home");
    setLocked(true);
  }, []);

  if (isLegalPage(page)) {
    const doc =
      page === "privacy"
        ? privacy
        : page === "terms"
          ? terms
          : page === "cookies"
            ? cookies
            : refunds;
    return (
      <div className="app">
        <LegalPage
          doc={doc}
          lang={lang}
          onToggleLang={toggleLang}
          onBack={() => setPage(legalReturn)}
        />
      </div>
    );
  }

  if (isBackendConfigured && !signedIn && !askingToSignIn) {
    return (
      <LandingPage
        lang={lang}
        onToggleLang={toggleLang}
        onSignIn={() => setAskingToSignIn(true)}
        onOpenLegal={openLegal}
      />
    );
  }

  if (isBackendConfigured && !signedIn) {
    return (
      <div className="app">
        <AccountGate
          lang={lang}
          onToggleLang={toggleLang}
          onOpenLegal={openLegal}
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

  if (!accepted) {
    return (
      <div className="app">
        <ConsentGate
          lang={lang}
          onToggleLang={toggleLang}
          onAccepted={() => setAccepted(true)}
          onOpenLegal={openLegal}
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
          <LegalLinks lang={lang} onOpen={openLegal} />
        </footer>
      </div>
    </div>
  );
}
