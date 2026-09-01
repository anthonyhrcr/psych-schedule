# Agenda Psi / The Practice Diary

A small, local-first web app for a psychologist's practice: book sessions,
keep a patient roster, and write session notes. Everything is saved in the
browser — there is no backend, no account, and no network call.

Available in Portuguese and English, toggled in the top-right corner.

## The three sections

The home page is a contents list leading to each one.

### Agenda

The schedule grid.

- **Five days at a time, centred on the selected date.** The window slides
  with your selection rather than locking to Monday–Friday, so weekends are
  shown and bookable like any other day.
- **16 one-hour slots per day** — an unbroken column from 06:00 to 22:00.
- **Click → type → save.** Click any hour, type a name, press Enter. Names
  already in the patient roster are offered as suggestions.
- **Multi-fill with Shift+click.** Shift+click a free cell, then shift+click
  another in the same day to make a range. Type a name once and it fills
  every selected cell — useful for a recurring patient.
- **A lunch break that actually moves.** Set any hours via the 🍽 handle on a
  day column header and those hours become the break. The setting belongs to
  that weekday, so Saturday's break stays Saturday's every week. A lunch hour
  can still be booked over when needed; the session then shows with a brass
  edge marking it as an override.
- **Day picker.** A full month calendar on the left and the visible five-day
  strip on the right. Clicking any day in either re-centres the grid on it.
  Today is always marked.

### Patients

A roster of the people you see — a name plus an optional reference note.
Names added here become autocomplete suggestions in the Agenda and populate
the patient selector in Evolution.

### Evolution

Session notes kept per patient. Pick someone from the roster, write an entry,
and it is filed against them with the date. Entries are listed newest first.

## Getting started

```bash
npm install
```

```bash
npm run dev
```

Then open <http://localhost:5173>.

## Build for production

```bash
npm run build
```

The built files in `dist/` can be hosted on any static host — Netlify, Vercel,
GitHub Pages, or copied straight onto the computer that will use it.

## Privacy

Everything stays in the browser's `localStorage`. There is no backend, no API,
and no analytics; nothing about a patient ever leaves the device.

The trade-off is that the data lives on exactly one browser on one machine.
Clearing site data deletes it, and there is no sync or backup — so use it on a
single device you control, and keep your own copy of anything you cannot lose.

## Keyboard and mouse

- **Click** a free hour — open the inline editor.
- **Shift+click** a free hour — start a multi-fill selection; shift+click
  another free hour in the same day to extend the range.
- **Enter** in the editor — save.
- **Esc** — clear the current selection, or close an open popover.
- **Click outside** an input — save.

## Stack

React 18 + TypeScript + Vite. No UI library, no state library, no router, and
no i18n library — just enough code to keep the bundle small and the app easy
to maintain.

Storage is versioned and migrates forward on read, so schedules written by
earlier versions of the app keep their original hours and dates.
