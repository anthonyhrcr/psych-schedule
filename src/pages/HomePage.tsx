import { Lang } from "../lib/schedule";
import { Page } from "../lib/navigation";
import { PageHeader } from "../components/PageHeader";
import { t } from "../i18n";

type Props = {
  lang: Lang;
  onToggleLang: () => void;
  onNavigate: (page: Page) => void;
};

export function HomePage({ lang, onToggleLang, onNavigate }: Props) {
  const sections: Array<{ page: Page; tab: string; title: string; desc: string }> = [
    { page: "agenda", tab: "var(--ink)", title: t(lang, "navAgenda"), desc: t(lang, "navAgendaDesc") },
    { page: "patients", tab: "var(--brass)", title: t(lang, "navPatients"), desc: t(lang, "navPatientsDesc") },
    { page: "evolution", tab: "var(--oxblood)", title: t(lang, "navEvolution"), desc: t(lang, "navEvolutionDesc") },
  ];

  return (
    <>
      <PageHeader
        title={t(lang, "homeTitle")}
        subtitle={t(lang, "homeSubtitle")}
        lang={lang}
        onToggleLang={onToggleLang}
      />
      <nav className="home-index" aria-label={t(lang, "homeTitle")}>
        {sections.map((section) => (
          <button
            key={section.page}
            type="button"
            className="home-index-item"
            style={{ ["--tab-color" as string]: section.tab }}
            onClick={() => onNavigate(section.page)}
          >
            <span className="home-index-tab" aria-hidden="true" />
            <span className="home-index-body">
              <span className="home-index-title-row">
                <span className="home-index-title">{section.title}</span>
                <span className="home-index-leader" aria-hidden="true" />
              </span>
              <span className="home-index-desc">{section.desc}</span>
            </span>
            <span className="home-index-arrow" aria-hidden="true">
              →
            </span>
          </button>
        ))}
      </nav>
    </>
  );
}
