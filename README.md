# Agenda da Semana / Weekly Schedule

A small, friendly web app for a psychologist to plan a weekly schedule of
patient sessions. Click any empty time slot, type the patient's name, and it's
saved automatically in the browser.

## What it does

- **5 days at a time, centred on the selected date** — the window slides with
  your selection instead of locking to Monday–Friday, so weekends are shown
  and bookable like any other day
- **16 one-hour slots per day** — an unbroken column from 6:00 to 22:00
- **Lunch that actually moves** — set any hours via the 🍽 handle on a day
  column header, and those hours become the break. The setting belongs to
  that weekday, so Saturday's break stays Saturday's every week. A lunch hour
  can still be booked over when needed: the session shows with a brass edge
  marking it as an override.
- **Click → type → save** — no menus, no settings
- **Multi-fill with Shift+click** — shift+click a free cell, then shift+click
  another to make a range. Type a name once and it's applied to every selected
  cell. Useful for recurring weekly patients.
- **Skyscanner-style day picker** — full month calendar on the left, the
  visible 5-day strip on the right. Click any day in either to re-centre the
  grid on it. Today is always highlighted.
- **Persistence** — schedules and lunch config are saved in the browser's
  localStorage, so they survive reloads but stay private (nothing is sent
  over the internet)
- **Portuguese / English** — toggle in the top-right; the app auto-detects
  the browser language on first visit

## Getting started

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>.

## Build for production

```bash
npm run build
npm run preview
```

The built files in `dist/` can be hosted on any static site host (Netlify,
Vercel, GitHub Pages, or even a USB stick on the psychologist's computer).

## Privacy

Everything stays in the browser. There is no backend, no API, no analytics.
If the psychologist clears their browser data, the schedule and lunch
config are lost — for that reason, the app is best used on a single device
they control.

## Stack

React 18 + TypeScript + Vite. No UI libraries, no state libraries, no
i18n libraries — just enough code to keep the bundle tiny and the app easy
to maintain.

## Keyboard shortcuts

- **Click** on a free cell — open the inline editor for that cell.
- **Shift+click** on a free cell — start a multi-fill selection. Shift+click
  another free cell to extend the range.
- **Enter** in the inline editor — save.
- **Esc** — clear any active selection or close any open popover.
- **Click outside** an input — save.
