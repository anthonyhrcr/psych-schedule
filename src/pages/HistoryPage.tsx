import { useMemo, useRef, useState } from "react";
import { Lang, formatDay, fromISODate } from "../lib/schedule";
import { toSessions, groupByDate, summarize } from "../lib/history";
import {
  loadAllDays,
  buildBackup,
  parseBackup,
  restoreBackup,
  RestoreResult,
} from "../lib/storage";
import { PageHeader } from "../components/PageHeader";
import { SecurityPanel } from "../components/SecurityPanel";
import { t } from "../i18n";

type Props = {
  lang: Lang;
  onToggleLang: () => void;
  onBack: () => void;
  onLock: () => void;
};

type Notice = { kind: "ok" | "error"; text: string };

export function HistoryPage({ lang, onToggleLang, onBack, onLock }: Props) {
  // Bumping this re-reads storage after a restore.
  const [revision, setRevision] = useState(0);
  const [patientFilter, setPatientFilter] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const allSessions = useMemo(() => toSessions(loadAllDays()), [revision]);
  const summary = useMemo(() => summarize(allSessions), [allSessions]);

  const filtered = useMemo(
    () =>
      patientFilter
        ? allSessions.filter((s) => s.patientName === patientFilter)
        : allSessions,
    [allSessions, patientFilter]
  );
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const handleExport = () => {
    const bundle = buildBackup();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agenda-psi-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setNotice({ kind: "ok", text: t(lang, "exportDone") });
  };

  const handleImport = async (file: File) => {
    try {
      const bundle = parseBackup(await file.text());
      if (!bundle) {
        setNotice({ kind: "error", text: t(lang, "importInvalid") });
        return;
      }
      const result: RestoreResult = restoreBackup(bundle);
      setRevision((r) => r + 1);
      setNotice({
        kind: "ok",
        text: t(lang, "importDone")
          .replace("{sessions}", String(result.sessions))
          .replace("{days}", String(result.days))
          .replace("{patients}", String(result.patients))
          .replace("{notes}", String(result.notes)),
      });
    } catch {
      setNotice({ kind: "error", text: t(lang, "importInvalid") });
    }
  };

  const range =
    summary.firstDateISO && summary.lastDateISO
      ? `${formatDay(fromISODate(summary.firstDateISO), lang)} — ${formatDay(
          fromISODate(summary.lastDateISO),
          lang
        )}`
      : "—";

  return (
    <>
      <PageHeader
        title={t(lang, "historyTitle")}
        subtitle={t(lang, "historySubtitle")}
        lang={lang}
        onToggleLang={onToggleLang}
        onBack={onBack}
      />

      <main className="page-main">
        <div className="stat-row">
          <div className="stat">
            <span className="stat-value">{summary.totalSessions}</span>
            <span className="stat-label">{t(lang, "statSessions")}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{summary.totalDays}</span>
            <span className="stat-label">{t(lang, "statDays")}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{summary.patients.length}</span>
            <span className="stat-label">{t(lang, "statPatients")}</span>
          </div>
          <div className="stat stat-wide">
            <span className="stat-value stat-value-sm">{range}</span>
            <span className="stat-label">{t(lang, "statRange")}</span>
          </div>
        </div>

        <div className="history-tools">
          <label className="field-label" htmlFor="history-filter">
            {t(lang, "filterByPatient")}
          </label>
          <select
            id="history-filter"
            className="text-input select-input"
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
          >
            <option value="">{t(lang, "allPatients")}</option>
            {summary.patients.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} ({p.count})
              </option>
            ))}
          </select>

          <div className="backup-actions">
            <button type="button" className="primary-btn" onClick={handleExport}>
              {t(lang, "exportBackup")}
            </button>
            <button
              type="button"
              className="nav-btn"
              onClick={() => fileRef.current?.click()}
            >
              {t(lang, "importBackup")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = "";
              }}
            />
          </div>
          <p className="backup-hint">{t(lang, "backupHint")}</p>
          {notice && (
            <p className={notice.kind === "ok" ? "notice-ok" : "notice-error"}>
              {notice.text}
            </p>
          )}

          <SecurityPanel
            lang={lang}
            onLock={onLock}
            onChanged={() => setRevision((r) => r + 1)}
          />
        </div>

        {grouped.length === 0 ? (
          <p className="empty-hint">{t(lang, "noHistory")}</p>
        ) : (
          <ul className="history-list">
            {grouped.map((day) => (
              <li key={day.dateISO} className="history-day">
                <div className="history-day-head">
                  <span className="history-day-date">
                    {formatDay(fromISODate(day.dateISO), lang)}
                  </span>
                  <span className="history-day-count">
                    {day.sessions.length} {t(lang, "sessionsSuffix")}
                  </span>
                </div>
                <ul className="history-sessions">
                  {day.sessions.map((s) => (
                    <li key={`${s.dateISO}:${s.slotIndex}`} className="history-session">
                      <span className="history-session-time">{s.time}</span>
                      <span className="history-session-name">{s.patientName}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
