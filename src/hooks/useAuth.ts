/** Provides typed access to the application authentication context. */

import { useContext } from "react";

import { AuthContext, type AuthContextValue } from "@/providers/AuthProvider";

/**
 * Read the current authenticated staff state and actions.
 * @throws When called outside {@link AuthProvider}.
 * @returns The current auth context value.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
