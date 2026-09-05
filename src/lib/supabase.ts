import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Both values are safe in the bundle: the anon key is designed to be public,
 * and row level security is what actually keeps one account out of another's
 * records. The service_role key must never appear here — it bypasses RLS.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * The app still works with no backend configured — it simply stays in
 * local-only mode, exactly as it behaves today. Accounts are an addition,
 * not a replacement, so a missing key degrades rather than breaks.
 */
export const isBackendConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isBackendConfigured) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

// --- Row shapes, mirroring supabase/schema.sql ------------------------------

export type AccountKeysRow = {
  user_id: string;
  password_salt: string;
  password_wrapped: string;
  password_iv: string;
  recovery_salt: string;
  recovery_wrapped: string;
  recovery_iv: string;
};

export type DayRow = {
  user_id: string;
  date: string;
  content: string;
  updated_at?: string;
};

export type PatientRow = {
  user_id: string;
  id: string;
  content: string;
  updated_at?: string;
};

export type NoteRow = {
  user_id: string;
  id: string;
  patient_id: string;
  date: string;
  content: string;
  updated_at?: string;
};

export type SettingsRow = {
  user_id: string;
  content: string;
  updated_at?: string;
};
