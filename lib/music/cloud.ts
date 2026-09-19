// BROKE MUSIC — optional Supabase cloud sync (auth + library backup).
// Local-first: everything works without env vars. If NEXT_PUBLIC_SUPABASE_URL
// + ANON_KEY are set, the settings page offers sign-in and playlist backup.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function cloudEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getCloudClient(): SupabaseClient | null {
  if (!cloudEnabled()) return null;
  if (client) return client;
  client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  );
  return client;
}
