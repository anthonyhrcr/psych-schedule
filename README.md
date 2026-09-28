# Agenda Psi / The Practice Diary

A web app for a psychologist's practice: book sessions, keep a patient roster, and write session notes.

**Live:** https://www.datapsi.com.br · Portuguese and English, toggled in the top-right corner.

It is **local-first**: everything works on one device with no account and no network. Two optional layers protect the data:

- **Passcode lock:** encrypts everything on the device.
- **Encrypted sync:** keeps several devices in step through Supabase. It is end to end, so the server never sees a patient name, a time or a note.

## Privacy and security

Session notes are clinical data, so the design starts from "the server should never be able to read them".

### Passcode lock (on-device)

- When a passcode is set, all records move into a single **AES-GCM-256** blob, and the plaintext copies are removed from `localStorage`.
- The key is derived from the passcode with **PBKDF2-SHA256 (210,000 iterations**, OWASP's floor). The passcode itself is never stored, not even hashed.
- A wrong passcode fails AES-GCM authentication instead of returning garbage.
- A forgotten passcode means unrecoverable data. That is why enabling the lock pushes the user to download a backup first.

### Encrypted accounts and sync (optional)

- Records are encrypted in the browser with a random **master key**. The server never sees it.
- The master key is **wrapped twice**:
  - once with a key derived from the password;
  - once with a key derived from a **recovery key** shown at signup. It is Crockford base32 with no I/L/O/U, so it can be copied off paper.
- Either one unlocks the account. Changing the password only re-wraps the key, so the records are never re-encrypted.
- Supabase stores the two wrapped keys and encrypted rows. Patient names, session times and note text are inside the ciphertext. Some metadata stays in the clear so rows can be queried, and the server can see it:
  - the **dates** that have bookings, and the date of each note;
  - opaque **patient IDs** (random UUIDs, not names), and so which notes belong to the same patient;
  - **when** each row was last changed, and **how many** rows exist.
- **Row-level security** on every table (`auth.uid() = user_id`) means a user can only read or write their own rows, even with the public anon key.
- On first sign-in, records already on the device can be uploaded into the account.
- A row that fails to decrypt is skipped rather than locking the whole account.

Leave the Supabase variables unset and the app runs exactly as before, on one device only.

## The four sections

The home page is a contents list leading to each one.

### Agenda

The schedule grid.

- **Five days at a time, centred on the selected date.** Weekends are shown and bookable like any other day.
- **16 one-hour slots per day,** from 06:00 to 22:00.
- **Click → type → save.** Names already in the patient roster are offered as suggestions.
- **Multi-fill with Shift+click.** Select a range in one day, type a name once, and it fills every cell. Useful for a recurring patient.
- **A lunch break per weekday.** Set it with the 🍽 handle on a day's header. It can still be booked over, and that session is marked as an override.
- **Day picker.** A month calendar plus the visible five-day strip. Today is always marked.

### Patients

A roster of names with an optional reference note. The roster feeds the Agenda's suggestions and the Evolution patient selector.

### Evolution

Session notes per patient, filed by date, newest first.

### History

- Every session ever booked, grouped by date, and filterable by patient.
- Totals: sessions, days booked, patients seen, and the span covered.
- **Download a backup:** one JSON file with every session, patient and note.
- **Restore from file:** merges by date and id, so restoring twice never duplicates anything.

## Tech

- **App:** React 18, TypeScript, Vite.
- **Cryptography:** the Web Crypto API (AES-GCM, PBKDF2, key wrapping). No third-party crypto libraries.
- **Backend (optional):** Supabase, for Postgres, Auth and row-level security. The schema is in [`supabase/schema.sql`](supabase/schema.sql).
- **Tests:** Vitest (unit) and Playwright (end to end), run in CI on every PR.
- **Deploy:** Vercel, building `main` on every push. Sync is enabled there by setting the two `VITE_SUPABASE_*` variables in the project's environment; without them the same build runs local-only.

```
src/
  lib/          schedule, patients, evolution, history, storage
                vault.ts    on-device encryption behind a passcode
                account.ts  master key, password and recovery-key wrapping
                sync.ts     encrypt → push / pull → decrypt
                auth.ts, supabase.ts
  components/   grid, calendar, editors, lock screen, account gate
  pages/        Home, Agenda, Patients, Evolution, History
supabase/       schema.sql (tables and RLS policies)
```

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. It runs local-only out of the box.

### Enabling sync (optional)

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Copy `.env.example` to `.env.local`, then fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - Both are public by design. RLS is what protects the data.
   - **Never** use the `service_role` key here.

## Testing

Two suites, weighted towards the places where records could go missing quietly, not towards coverage numbers.

**Unit tests: Vitest, 93 tests** over `src/lib`:
- version migrations, and backup and restore;
- the diffing that decides what gets deleted on sync;
- the failure modes of both encryption paths: wrong passcode, damaged rows, and wrapping and unwrapping keys.

To check the suite actually catches things, three real past bugs were put back in one at a time: an hour-shift in v1 data, a swallowed database error, and a repeating recovery key. Each one turns it red. Writing the suite also exposed a real lost-write bug: `lock()` didn't wait for the encrypted write to finish. That is now fixed.

**End-to-end tests: Playwright, 30 tests** over the local-only flows:
- booking, multi-fill and lunch overrides on the Agenda;
- patients, notes and History;
- backup, restore and the passcode lock;
- tap behaviour on a mobile device profile (Pixel 7), alongside desktop Chrome.

The app is started with Supabase disabled, so no test touches a real backend.

**CI:** every pull request and every push to `main` runs a type check, the unit tests, a production build, and the Playwright suite.

```bash
npm test          # unit tests
npm run coverage  # unit tests with coverage
npm run e2e       # Playwright (first run: npx playwright install chromium)
```

## Build

```bash
npm run build
```

The output in `dist/` is static and can be hosted anywhere.
