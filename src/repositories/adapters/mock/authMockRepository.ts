/**
 * In-memory auth adapter used when Supabase environment values are absent.
 * It preserves the existing zero-setup mock development workflow.
 */

import type { AuthRepository } from "@/repositories/types";
import type { AuthSession, StaffProfile } from "@/types/auth";

const MOCK_SESSION: AuthSession = {
  userId: "mock-staff-user",
  email: "owner@servestation.local",
};

const MOCK_PROFILE: StaffProfile = {
  userId: MOCK_SESSION.userId,
  storeId: "mock-store",
  storeName: "ServeStation Main",
  displayName: "Avery Stone",
  role: "owner",
};

/** Create the mock auth adapter with an immediately available owner session. */
export function createMockAuthRepository(): AuthRepository {
  let session: AuthSession | null = MOCK_SESSION;
  const listeners = new Set<(next: AuthSession | null) => void>();

  /** Notify app-shell subscribers after a mock session change. */
  function publish() {
    for (const listener of listeners) listener(session);
  }

  return {
    requiresSignIn: false,
    async getSession() {
      return session;
    },
    onAuthStateChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async signIn(email) {
      session = { ...MOCK_SESSION, email: email.trim() || MOCK_SESSION.email };
      publish();
      return session;
    },
    async signOut() {
      // Mock mode stays usable without credentials; sign-out restores the
      // seeded developer identity rather than presenting a non-functional gate.
      session = MOCK_SESSION;
      publish();
    },
    async getStaffProfile() {
      return MOCK_PROFILE;
    },
  };
}
