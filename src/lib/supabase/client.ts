/**
 * Lazily constructed Supabase client for repository adapters and authentication.
 *
 * Only the public project URL and anon/publishable key are used. Native sessions
 * persist in AsyncStorage, while token refresh follows the app lifecycle.
 */

import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createClient,
  processLock,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { AppState, Platform, type NativeEventSubscription } from "react-native";

let client: SupabaseClient | null = null;
let appStateSubscription: NativeEventSubscription | null = null;

/**
 * Get the shared Supabase client, creating it on first call.
 * @throws If the public Supabase environment values are missing.
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
      ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });

  // Register once for the singleton. Pausing refresh in the background avoids
  // unnecessary work when a tablet sleeps or another app is active.
  if (Platform.OS !== "web" && !appStateSubscription) {
    appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        client?.auth.startAutoRefresh();
      } else {
        client?.auth.stopAutoRefresh();
      }
    });
  }

  return client;
}
