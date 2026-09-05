-- Diário da Prática — database schema
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- Two principles shape everything below:
--
--   1. The server never sees a patient name or a note. Every column holding
--      clinical content is named `content` and stores ciphertext produced on
--      the user's device. The server cannot read it, and neither can anyone
--      with database access.
--
--   2. Isolation is enforced by the database, not by application code. Every
--      table has row level security allowing a user to touch only their own
--      rows. A bug in the app cannot expose one user's records to another.
--
-- What the server does learn, unavoidably, is metadata: which dates a user has
-- bookings on, and how many records they hold. Names, times and note text are
-- all inside the ciphertext.

-- ---------------------------------------------------------------------------
-- Account key material
-- ---------------------------------------------------------------------------
-- The master key that decrypts a user's records, stored twice: wrapped by
-- their password and wrapped by their recovery key. Both are useless without
-- the corresponding secret, neither of which is ever sent to the server.

create table if not exists account_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  password_salt text not null,
  password_wrapped text not null,
  password_iv text not null,
  recovery_salt text not null,
  recovery_wrapped text not null,
  recovery_iv text not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Records
-- ---------------------------------------------------------------------------

-- One row per booked day. `content` is the encrypted slot map.
create table if not exists days (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  content text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- Patient ids are opaque client-generated uuids; the name lives in `content`.
create table if not exists patients (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  content text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- `patient_id` stays in the clear so notes can be fetched per patient without
-- downloading everything. It reveals only that two notes concern the same
-- (unnamed) person.
create table if not exists notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  patient_id uuid not null,
  date date not null,
  content text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- Lunch configuration, one row per user; `content` is the encrypted map.
create table if not exists settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content text not null,
  updated_at timestamptz not null default now()
);

create index if not exists notes_by_patient on notes (user_id, patient_id);
create index if not exists days_by_date on days (user_id, date);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- Without these, the anon key would let any signed-in user read every row.
-- With them, `auth.uid()` scopes every query to its owner at the database
-- level, so this holds even if the client is malicious.

alter table account_keys enable row level security;
alter table days enable row level security;
alter table patients enable row level security;
alter table notes enable row level security;
alter table settings enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['account_keys', 'days', 'patients', 'notes', 'settings']
  loop
    execute format('drop policy if exists own_rows_select on %I', t);
    execute format('drop policy if exists own_rows_insert on %I', t);
    execute format('drop policy if exists own_rows_update on %I', t);
    execute format('drop policy if exists own_rows_delete on %I', t);

    execute format(
      'create policy own_rows_select on %I for select using (auth.uid() = user_id)', t);
    execute format(
      'create policy own_rows_insert on %I for insert with check (auth.uid() = user_id)', t);
    execute format(
      'create policy own_rows_update on %I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format(
      'create policy own_rows_delete on %I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Keep updated_at honest, so sync can resolve conflicts by recency.
-- ---------------------------------------------------------------------------

create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

do $$
declare
  t text;
begin
  foreach t in array array['account_keys', 'days', 'patients', 'notes', 'settings']
  loop
    execute format('drop trigger if exists set_updated_at on %I', t);
    execute format(
      'create trigger set_updated_at before update on %I
         for each row execute function touch_updated_at()', t);
  end loop;
end $$;
