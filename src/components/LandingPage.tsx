import { useEffect, useRef } from "react";
import { Lang } from "../lib/schedule";
import { Page } from "../lib/navigation";
import { landingCopy } from "../landing/copy";
import { t } from "../i18n";
import agendaGrid from "../assets/landing/agenda-grid.png";
import agendaMobile from "../assets/landing/agenda-mobile.png";
import evolution from "../assets/landing/evolution.png";
import "../landing/landing.css";

type Props = {
  lang: Lang;
  onToggleLang: () => void;
  onSignIn: () => void;
  onOpenLegal: (page: Page) => void;
};

/**
 * The public face of the product. Until now a visitor met a password field
 * and nothing else, which is a poor way to ask someone for their patients'
 * records.
 *
 * Motion here is IntersectionObserver and CSS only. The app already carries a
 * 450 KB bundle, and adding an animation library so that four sections can
 * fade in would be a bad trade. Everything collapses under reduced motion.
 */
export function LandingPage({ lang, onToggleLang, onSignIn, onOpenLegal }: Props) {
  const copy = landingCopy(lang);
  const root = useRef<HTMLDivElement>(null);

  // Reveal on entry: the page argues in sequence, so each section arrives
  // when it is read rather than all at once.
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
    );
    node.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing" ref={root}>
      <header className="landing-nav">
        <span className="landing-wordmark">Agenda Psi</span>
        <div className="landing-nav-actions">
          <button type="button" className="lang-toggle" onClick={onToggleLang}>
            {t(lang, "languageToggle")}
          </button>
          <button type="button" className="landing-btn landing-btn-ghost" onClick={onSignIn}>
            {copy.navSignIn}
          </button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <h1 className="landing-h1 reveal" style={{ "--step": 0 } as React.CSSProperties}>
              {copy.heroTitleLead}{" "}
              <em>{copy.heroTitleEmphasis}</em>
            </h1>
            <p className="landing-lede reveal" style={{ "--step": 1 } as React.CSSProperties}>
              {copy.heroBody}
            </p>
            <div className="landing-cta-row reveal" style={{ "--step": 2 } as React.CSSProperties}>
              <button type="button" className="landing-btn landing-btn-primary" onClick={onSignIn}>
                {copy.heroCtaPrimary}
              </button>
              <a className="landing-btn landing-btn-quiet" href="#how">
                {copy.heroCtaSecondary}
              </a>
            </div>
          </div>
          <div className="landing-hero-artifact reveal" style={{ "--step": 3 } as React.CSSProperties}>
            <img src={agendaGrid} alt={copy.heroArtifactAlt} width={1004} height={1018} />
          </div>
        </section>

        <section className="landing-sheet reveal">
          <h2 className="landing-h2">{copy.cryptoTitle}</h2>
          <p className="landing-body">{copy.cryptoBody}</p>
          <div className="landing-ledger">
            <div>
              <h3 className="landing-h3">{copy.cryptoSeesTitle}</h3>
              <ul className="landing-list">
                {copy.cryptoSees.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="landing-ledger-never">
              <h3 className="landing-h3">{copy.cryptoNeverTitle}</h3>
              <ul className="landing-list">
                {copy.cryptoNever.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="landing-week" id="how">
          <div className="landing-week-head reveal">
            <h2 className="landing-h2 landing-h2-light">{copy.weekTitle}</h2>
            <p className="landing-body landing-body-light">{copy.weekBody}</p>
          </div>
          <div className="landing-week-body">
            <div className="landing-phone reveal">
              <img src={agendaMobile} alt={copy.weekAlt} width={390} height={844} />
            </div>
            <dl className="landing-points reveal">
              {copy.weekPoints.map((point) => (
                <div key={point.title}>
                  <dt>{point.title}</dt>
                  <dd>{point.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="landing-rest reveal">
          <h2 className="landing-h2 landing-h2-light">{copy.restTitle}</h2>
          <div className="landing-bento">
            <article className="landing-tile landing-tile-shot">
              <img src={evolution} alt={copy.restAlt} width={680} height={352} />
            </article>
            <article className="landing-tile landing-tile-wide">
              <h3 className="landing-h3">{copy.rest[0].title}</h3>
              <p>{copy.rest[0].body}</p>
            </article>
            <article className="landing-tile landing-tile-ink">
              <h3 className="landing-h3">{copy.rest[1].title}</h3>
              <p>{copy.rest[1].body}</p>
            </article>
            <article className="landing-tile">
              <h3 className="landing-h3">{copy.rest[2].title}</h3>
              <p>{copy.rest[2].body}</p>
            </article>
            <article className="landing-tile landing-tile-brass landing-tile-full">
              <h3 className="landing-h3">{copy.rest[3].title}</h3>
              <p>{copy.rest[3].body}</p>
            </article>
          </div>
        </section>

        <section className="landing-cost reveal">
          <h2 className="landing-h2">{copy.costTitle}</h2>
          <p className="landing-body">{copy.costBody}</p>
          <p className="landing-cost-detail">{copy.costDetail}</p>
        </section>

        <section className="landing-close reveal">
          <h2 className="landing-h2 landing-h2-light">{copy.closeTitle}</h2>
          <p className="landing-body landing-body-light">{copy.closeBody}</p>
          <button type="button" className="landing-btn landing-btn-primary" onClick={onSignIn}>
            {copy.closeCta}
          </button>
        </section>
      </main>

      <footer className="landing-footer">
        <p>{copy.footerNote}</p>
        <nav className="landing-footer-links">
          <button type="button" className="link-btn" onClick={() => onOpenLegal("privacy")}>
            {copy.footerPrivacy}
          </button>
          <button type="button" className="link-btn" onClick={() => onOpenLegal("terms")}>
            {copy.footerTerms}
          </button>
          <button type="button" className="link-btn" onClick={() => onOpenLegal("cookies")}>
            {copy.footerCookies}
          </button>
          <button type="button" className="link-btn" onClick={() => onOpenLegal("refunds")}>
            {copy.footerRefunds}
          </button>
        </nav>
      </footer>
    </div>
  );
}
