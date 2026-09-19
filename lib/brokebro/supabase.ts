import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client with graceful demo fallback.
 * If NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are missing, app runs local-first
 * (Zustand + localStorage) and auth uses a local demo profile.
 */
export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(url, key);
}

export function supabaseOrNull() {
  if (!hasSupabaseEnv()) return null;
  try {
    return createClient();
  } catch {
    return null;
  }
}
