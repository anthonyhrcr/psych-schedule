import { Lang } from "../lib/schedule";
import { LegalDocPair } from "../legal/types";
import { PageHeader } from "./PageHeader";
import { t } from "../i18n";

type Props = {
  doc: LegalDocPair;
  lang: Lang;
  onToggleLang: () => void;
  onBack: () => void;
};

/**
 * One renderer for all three documents. They are reachable without signing
 * in — someone deciding whether to trust the platform has to be able to read
 * them before handing it anything.
 */
export function LegalPage({ doc, lang, onToggleLang, onBack }: Props) {
  const text = doc[lang];

  return (
    <div className="container">
      <PageHeader
        title={text.title}
        lang={lang}
        onToggleLang={onToggleLang}
        onBack={onBack}
      />

      <main className="legal-doc">
        <p className="legal-updated">
          {t(lang, "lastUpdated")} {text.updated}
        </p>

        {text.intro.map((paragraph, i) => (
          <p key={`intro-${i}`} className="legal-intro">
            {paragraph}
          </p>
        ))}

        {text.sections.map((section) => (
          <section key={section.heading} className="legal-section">
            <h2 className="section-heading">{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <p key={i} className="legal-paragraph">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
