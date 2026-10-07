/**
 * Captures the product shots used on the landing page.
 *
 * The landing page shows the real application rather than a mock drawn in
 * divs, so these have to be regenerated whenever the agenda changes shape.
 * Run against the local-only dev server:
 *
 *   npx vite --port 5175 --strictPort       (in one terminal)
 *   node scripts/capture-landing-shots.mjs  (in another)
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const BASE = process.env.CAPTURE_URL ?? "http://localhost:5175";
const OUT = "src/assets/landing";

// A week that looks like a practice rather than a demo: uneven, with gaps.
const NAMES = [
  "Marina Albuquerque", "Tiago Ferraz", "Beatriz Nunes", "Rafael Camargo",
  "Helena Vasques", "Caio Monteiro", "Lúcia Rebelo",
];

async function seed(page) {
  await page.evaluate((names) => {
    const iso = (d) => d.toISOString().slice(0, 10);
    const today = new Date();
    const day = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d); };
    const plan = {
      [day(-2)]: { 3: names[0], 6: names[1], 9: names[2] },
      [day(-1)]: { 4: names[3], 7: names[0] },
      [day(0)]: { 2: names[4], 5: names[1], 8: names[5], 10: names[2] },
      [day(1)]: { 3: names[6], 6: names[4] },
      [day(2)]: { 4: names[5], 9: names[3] },
    };
    for (const [d, slots] of Object.entries(plan)) {
      localStorage.setItem("psych-schedule:v3:day:" + d, JSON.stringify(slots));
    }

    // The roster and the notes, so the Evolution shot shows the product
    // working rather than its empty state.
    const roster = names.map((name, i) => ({
      id: "p" + (i + 1),
      name,
      createdAt: new Date(2026, 0, i + 2).toISOString(),
      note: i === 0 ? "Encaminhada pela clínica. Sessões quinzenais." : undefined,
    }));
    localStorage.setItem("psych-schedule:v1:patients", JSON.stringify(roster));

    const notes = [
      {
        date: day(0),
        text:
          "Retomou o assunto do trabalho sem que eu perguntasse. Falou da reunião de segunda e " +
          "do que sentiu depois. Combinamos observar o padrão até a próxima sessão.",
      },
      {
        date: day(-7),
        text:
          "Sessão mais curta, chegou atrasada. Trouxe o episódio com a irmã. Reconheceu a " +
          "repetição sem que eu apontasse, o que não tinha acontecido antes.",
      },
      {
        date: day(-14),
        text:
          "Primeira vez que descreveu o sono com algum detalhe. Acorda por volta das quatro e " +
          "não volta a dormir. Vamos acompanhar.",
      },
    ].map((n, i) => ({
      id: "n" + (i + 1),
      patientId: "p1",
      date: n.date,
      text: n.text,
      createdAt: new Date().toISOString(),
    }));
    localStorage.setItem("psych-schedule:v1:evolution", JSON.stringify(notes));
    localStorage.setItem(
      "psych-schedule:v1:consent",
      JSON.stringify({ version: "2026-10-06", acceptedAt: new Date().toISOString() })
    );
  }, NAMES);
}

// Element shots, not viewport shots: the landing page wants the artifact
// itself, and a viewport capture leads with the date picker instead of the
// booked week.
const shots = [
  { name: "agenda-grid", width: 1440, height: 1000, scale: 2, section: 0, clip: ".schedule-scroll" },
  { name: "agenda-mobile", width: 390, height: 844, scale: 3, section: 0, clip: ".schedule-scroll" },
  { name: "evolution", width: 820, height: 900, scale: 2, section: 2, clip: ".entry-list" },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const shot of shots) {
  const page = await browser.newPage({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: shot.scale,
  });
  await page.goto(BASE);
  await seed(page);
  await page.reload();
  await page.locator(".home-index-item").nth(shot.section).click();
  await page.waitForTimeout(700);
  const target = shot.clip ? page.locator(shot.clip).first() : page;
  await target.screenshot({ path: `${OUT}/${shot.name}.png` });
  console.log(`captured ${OUT}/${shot.name}.png`);
  await page.close();
}

await browser.close();
