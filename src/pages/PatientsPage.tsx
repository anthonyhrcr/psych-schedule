import { FormEvent, useState } from "react";
import { Lang } from "../lib/schedule";
import { Patient } from "../lib/patients";
import { loadPatients, savePatients } from "../lib/storage";
import { PageHeader } from "../components/PageHeader";
import { t } from "../i18n";

type Props = {
  lang: Lang;
  onToggleLang: () => void;
  onBack: () => void;
};

export function PatientsPage({ lang, onToggleLang, onBack }: Props) {
  const [patients, setPatients] = useState<Patient[]>(() => loadPatients());
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  const addPatient = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const patient: Patient = {
      id: crypto.randomUUID(),
      name: trimmedName,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    const next = [...patients, patient];
    setPatients(next);
    savePatients(next);
    setName("");
    setNote("");
  };

  const removePatient = (id: string) => {
    const next = patients.filter((p) => p.id !== id);
    setPatients(next);
    savePatients(next);
  };

  return (
    <>
      <PageHeader
        title={t(lang, "patientsTitle")}
        subtitle={t(lang, "patientsSubtitle")}
        lang={lang}
        onToggleLang={onToggleLang}
        onBack={onBack}
      />

      <main className="page-main">
        <form className="inline-form" onSubmit={addPatient}>
          <input
            type="text"
            className="text-input"
            placeholder={t(lang, "patientNamePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            className="text-input"
            placeholder={t(lang, "patientNotePlaceholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button type="submit" className="primary-btn" disabled={!name.trim()}>
            {t(lang, "addPatientBtn")}
          </button>
        </form>

        {patients.length === 0 ? (
          <p className="empty-hint">{t(lang, "noPatientsYet")}</p>
        ) : (
          <ul className="item-list">
            {patients.map((p) => (
              <li key={p.id} className="item-row">
                <div className="item-row-main">
                  <span className="item-row-title">{p.name}</span>
                  {p.note && <span className="item-row-subtitle">{p.note}</span>}
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={t(lang, "delete")}
                  onClick={() => removePatient(p.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
