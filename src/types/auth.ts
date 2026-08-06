/**
 * Authenticated staff view types shared by the auth repository and UI provider.
 * Supabase-specific session objects stay inside the Supabase adapter.
 */

/** First-release authorization roles assigned by a trusted operator. */
export type StaffRole = "owner" | "manager" | "cashier";

/** Minimal authenticated session exposed to the application. */
export interface AuthSession {
  userId: string;
  email: string;
}

/** Store-scoped staff profile linked one-to-one with a Supabase Auth user. */
export interface StaffProfile {
  userId: string;
  storeId: string;
  storeName: string;
  displayName: string;
  role: StaffRole;
}
