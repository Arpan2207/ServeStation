/**
 * Supabase implementation of the authentication repository.
 * Supabase SDK shapes are mapped into app-owned auth types at this boundary.
 */

import type { Session } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/lib/supabase/client";
import type { AuthRepository } from "@/repositories/types";
import type { AuthSession, StaffProfile, StaffRole } from "@/types/auth";

interface StaffProfileRow {
  user_id: string;
  store_id: string;
  display_name: string;
  role: StaffRole;
  is_active: boolean;
  stores: { name: string } | { name: string }[] | null;
}

/** Map an SDK session into the minimal app-owned session shape. */
function mapSession(session: Session | null): AuthSession | null {
  if (!session) return null;
  return {
    userId: session.user.id,
    email: session.user.email ?? "",
  };
}

/** Resolve an embedded store name across PostgREST relation inference shapes. */
function storeNameFromRow(row: StaffProfileRow): string {
  if (Array.isArray(row.stores)) return row.stores[0]?.name ?? "Store";
  return row.stores?.name ?? "Store";
}

/**
 * Create the Supabase-backed authentication adapter.
 * @returns Email/password auth, session subscription, and staff-profile reads.
 */
export function createSupabaseAuthRepository(): AuthRepository {
  return {
    requiresSignIn: true,

    async getSession() {
      const { data, error } = await getSupabaseClient().auth.getSession();
      if (error) throw new Error(`Failed to restore session: ${error.message}`);
      return mapSession(data.session);
    },

    onAuthStateChange(listener) {
      const { data } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
        listener(mapSession(session));
      });
      return () => data.subscription.unsubscribe();
    },

    async signIn(email, password) {
      const { data, error } = await getSupabaseClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw new Error(error.message);
      const session = mapSession(data.session);
      if (!session) throw new Error("Sign-in completed without an active session.");
      return session;
    },

    async signOut() {
      const { error } = await getSupabaseClient().auth.signOut();
      if (error) throw new Error(`Failed to sign out: ${error.message}`);
    },

    async getStaffProfile(userId) {
      const { data, error } = await getSupabaseClient()
        .from("staff_profiles")
        .select("user_id, store_id, display_name, role, is_active, stores ( name )")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw new Error(`Failed to load staff profile: ${error.message}`);
      if (!data) return null;

      const row = data as unknown as StaffProfileRow;
      return {
        userId: row.user_id,
        storeId: row.store_id,
        storeName: storeNameFromRow(row),
        displayName: row.display_name,
        role: row.role,
      } satisfies StaffProfile;
    },
  };
}
