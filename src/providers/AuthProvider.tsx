/**
 * Application auth provider that restores sessions and resolves active staff.
 * Screens consume the app-owned context rather than the Supabase SDK directly.
 */

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { authRepository } from "@/repositories";
import type { AuthSession, StaffProfile } from "@/types/auth";

/** Auth state and actions made available to the app shell and profile screen. */
export interface AuthContextValue {
  session: AuthSession | null;
  staffProfile: StaffProfile | null;
  loading: boolean;
  error: string | null;
  requiresSignIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/** Internal context; access through {@link useAuth}. */
export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Restore and observe the current auth session for all routes.
 * @param props Application route tree.
 * @returns An auth context provider around the route tree.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hydrationId = useRef(0);

  /** Apply a session only after its active staff profile has been verified. */
  const hydrateSession = useCallback(async (nextSession: AuthSession | null) => {
    const requestId = ++hydrationId.current;
    setLoading(true);
    setError(null);

    if (!nextSession) {
      setSession(null);
      setStaffProfile(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await authRepository.getStaffProfile(nextSession.userId);
      if (requestId !== hydrationId.current) return;
      if (!profile) {
        throw new Error("This account does not have an active ServeStation staff profile.");
      }
      setSession(nextSession);
      setStaffProfile(profile);
    } catch (caught) {
      if (requestId !== hydrationId.current) return;
      setSession(null);
      setStaffProfile(null);
      setError(caught instanceof Error ? caught.message : "Unable to load staff access.");
    } finally {
      if (requestId === hydrationId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void authRepository
      .getSession()
      .then((initialSession) => {
        if (mounted) return hydrateSession(initialSession);
      })
      .catch((caught) => {
        if (!mounted) return;
        setError(caught instanceof Error ? caught.message : "Unable to restore session.");
        setLoading(false);
      });

    const unsubscribe = authRepository.onAuthStateChange((nextSession) => {
      if (mounted) void hydrateSession(nextSession);
    });
    return () => {
      mounted = false;
      hydrationId.current += 1;
      unsubscribe();
    };
  }, [hydrateSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const nextSession = await authRepository.signIn(email, password);
      await hydrateSession(nextSession);
    },
    [hydrateSession]
  );

  const signOut = useCallback(async () => {
    await authRepository.signOut();
    if (authRepository.requiresSignIn) await hydrateSession(null);
  }, [hydrateSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      staffProfile,
      loading,
      error,
      requiresSignIn: authRepository.requiresSignIn,
      signIn,
      signOut,
    }),
    [session, staffProfile, loading, error, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
