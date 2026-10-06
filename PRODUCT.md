# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Psychologists in private practice in Brazil, working in Portuguese, each keeping
their own caseload and their own records. Confirmed direction: the product is
aimed at Brazilian psychologists broadly and is intended to be sold, so future
work has to carry acquisition, self-service onboarding, billing and support.

Patients are not users. They never sign in. Their names, session times and notes
are the content the product protects, and they exercise their rights through
their psychologist, who is the only person able to read them.

Today accounts are created by invitation and there is no public sign-up.
Whether self-service registration replaces that is an open decision.

## Product Purpose

Book sessions by the hour, keep a patient roster, write session notes filed by
patient and date, and look back over the history — with records that stay
readable to the practitioner and unreadable to everyone else, the operator
included.

Success is a psychologist trusting it with real clinical notes, every working
day, instead of a paper diary or a spreadsheet.

## Positioning

End-to-end encryption the operator cannot undo. Patient names, session times and
note text are encrypted on the device before anything is sent; the server holds
ciphertext and metadata only (which dates have bookings, random patient UUIDs,
timestamps, row counts). No court order, breach or internal decision makes the
clinical content readable.

Paired with it: local-first. The whole product works on one device with no
account and no network, and sync is an addition rather than a precondition.

A competitor storing notes in readable form cannot truthfully claim either.

## Operating Context

- Used by a practising psychologist between sessions, often on a phone.
- The day runs 06:00–22:00 in one-hour slots. Five days are visible at a time,
  centred on the selected date; weekends are bookable like any other day.
- A lunch break is set per weekday and can be booked over, which marks that
  session as an override.
- Four sections reached from a contents page: Agenda, Patients, Evolution,
  History. Four legal documents are readable without signing in.
- Brazilian regulatory context: the LGPD, under which the professional is the
  controller and the platform the operator; and Conselho Federal de Psicologia
  rules on documentation and record retention, which are the professional's
  obligation.
- Portuguese (pt-BR) is the working language; English is available from a
  toggle. Portuguese governs the legal documents.

## Capabilities and Constraints

- Local storage first, with versioned keys and lazy migrations. Optional sync
  through Supabase (Postgres, Auth, row-level security).
- AES-GCM-256 with PBKDF2-SHA256 at 210,000 iterations. The master key is
  wrapped twice, by the password and by a recovery key; changing a password
  re-wraps the key and never re-encrypts records.
- A device passcode lock encrypts every record on the device into one blob.
- Backup and restore is a single JSON file, and it is **not encrypted**. It is
  the weakest point in the design and is named as such in the documents.
- No cookies at all. The session token and the diary live in localStorage. The
  typeface is self-hosted. There are no analytics and no third-party requests.
- The documents are accepted once per device; the accepted version is recorded
  on the device and, with an account, in a `consents` table.
- Undecided, and not to be invented: price and billing cycle; whether
  self-service sign-up replaces invitations; the legal entity details (the
  `OPERATOR` placeholders in `src/legal/types.ts` are unfilled); the Supabase
  database region, which decides whether an international transfer applies.

## Brand Commitments

- The product is called **Agenda Psi**, in both languages and everywhere it is
  named. Earlier headings read "Diário da Prática" and "The Practice Diary";
  they were brought into line and the old names are not to come back.
- **JetBrains Mono**, pinned by the user after matcha.fm and now served from the
  product's own origin. Binding.
- Bilingual Portuguese and English, with a visible toggle on every screen.
- Voice: plain and specific, willing to state the unwelcome thing rather than
  soften it — that a lost recovery key is final, that the backup file is
  readable, that a refund returns money and not data.

## Evidence on Hand

- Live at https://www.datapsi.com.br, deployed by Vercel from `main`.
- Repository: `anthonyhrcr/psych-schedule`. 113 unit tests and 33 end-to-end
  tests run in CI on every pull request.
- Four legal documents in `src/legal/`, in both languages, with the operator's
  identifying details still unfilled.
- Database schema with row-level security in `supabase/schema.sql`.
- There are **no** customers, testimonials, case studies, usage numbers, press
  or pricing. None of these may be fabricated by future work.

## Product Principles

1. The server must never be able to read a patient's name or a note. A feature
   that would require it is out of scope, not a trade-off to weigh.
2. The practitioner is the controller and the platform is the operator. The
   product never implies it can see, recover or vouch for what it cannot.
3. Say the unwelcome thing plainly, and early enough to change what someone
   does — before the key is lost, not after.
4. It works on one device, offline, with no account. Sync is an addition.
5. Record-keeping here is a legal obligation for the user, not a preference.
   Retention, export and proof of acceptance are first-class, not settings.

## Accessibility & Inclusion

A confirmed user has **low vision**. Text size, contrast and zoom behaviour are
durable constraints rather than polish: small type, low-contrast text on the
cream ground, and any layout that breaks at 200% zoom count as defects.

Already in place and not to be regressed: `prefers-reduced-motion` is honoured,
the schedule grid and day strip carry ARIA roles, and touch targets on phones
were corrected once already after a hover-only affordance made the grid
unusable.
