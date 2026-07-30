/**
 * Lazily-constructed Supabase client for ServeStation's repository adapters.
 *
 * Only the public project URL and publishable/anon key are read here. Screen
 * components must never import this module directly; the Supabase repository
 * adapters are the only layer allowed to use it.
 *
 * The client is created on first use (not at import time) so that importing this
 * module is always safe — even when Supabase is not configured and the app is
 * running on the mock adapters. Authentication persistence is configured later
 * with Step 8 (Auth + RLS).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Get the shared Supabase client, creating it on first call.
 * @throws If the public Supabase env values are missing.
 * @returns The memoized Supabase client.
 */
export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copy .env.example to .env.local and supply the public Supabase values."
    );
  }

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Auth/RLS are added in Step 8; React Native storage is configured then.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return client;
}
