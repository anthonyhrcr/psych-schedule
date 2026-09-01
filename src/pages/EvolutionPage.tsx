import { FormEvent, useState } from "react";
import { Lang, formatDay, fromISODate, toISODate } from "../lib/schedule";
import { Patient } from "../lib/patients";
import { EvolutionEntry } from "../lib/evolution";
import { loadEvolutionEntries, loadPatients, saveEvolutionEntries } from "../lib/storage";
import { PageHeader } from "../components/PageHeader";
import { t } from "../i18n";

type Props = {
  lang: Lang;
  onToggleLang: () => void;
  onBack: () => void;
  onGoToPatients: () => void;
};

export function EvolutionPage({ lang, onToggleLang, onBack, onGoToPatients }: Props) {
  const [patients] = useState<Patient[]>(() => loadPatients());
  const [selectedId, setSelectedId] = useState<string>(patients[0]?.id ?? "");
  const [entries, setEntries] = useState<EvolutionEntry[]>(() => loadEvolutionEntries());
  const [text, setText] = useState("");

  const patientEntries = entries
    .filter((entry) => entry.patientId === selectedId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const addEntry = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !selectedId) return;
    const entry: EvolutionEntry = {
      id: crypto.randomUUID(),
      patientId: selectedId,
      date: toISODate(new Date()),
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    const next = [...entries, entry];
    setEntries(next);
    saveEvolutionEntries(next);
    setText("");
  };

  return (
    <>
      <PageHeader
        title={t(lang, "evolutionTitle")}
        subtitle={t(lang, "evolutionSubtitle")}
        lang={lang}
        onToggleLang={onToggleLang}
        onBack={onBack}
      />

      <main className="page-main">
        {patients.length === 0 ? (
          <div className="empty-state">
            <p className="empty-hint">{t(lang, "noPatientsForEvolution")}</p>
            <button type="button" className="primary-btn" onClick={onGoToPatients}>
              {t(lang, "goToPatients")}
            </button>
          </div>
        ) : (
          <>
            <label className="field-label" htmlFor="evolution-patient-select">
              {t(lang, "selectPatientLabel")}
            </label>
            <select
              id="evolution-patient-select"
              className="text-input select-input"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <form className="stacked-form" onSubmit={addEntry}>
              <textarea
                className="text-area"
                rows={4}
                placeholder={t(lang, "newEntryPlaceholder")}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button type="submit" className="primary-btn" disabled={!text.trim()}>
                {t(lang, "addEntryBtn")}
              </button>
            </form>

            {patientEntries.length === 0 ? (
              <p className="empty-hint">{t(lang, "noEntriesYet")}</p>
            ) : (
              <ul className="entry-list">
                {patientEntries.map((entry) => (
                  <li key={entry.id} className="entry-item">
                    <div className="entry-item-date">{formatDay(fromISODate(entry.date), lang)}</div>
                    <p className="entry-item-text">{entry.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </>
  );
}
