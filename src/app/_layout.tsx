/** Root layout that restores staff auth and protects all operational routes. */

import "@/theme/unistyles";

import { Redirect, Stack, useSegments } from "expo-router";

import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { AuthProvider } from "@/providers/AuthProvider";

/** Route stack that redirects according to authenticated staff state. */
function ProtectedStack() {
  const { session, staffProfile, loading, requiresSignIn } = useAuth();
  const segments = useSegments();
  // Expo's generated route union updates after Metro sees the new route; cast
  // here so a clean type-check also recognizes the newly added auth segment.
  const onSignInRoute = (segments as string[])[0] === "sign-in";
  const authenticated = !!session && !!staffProfile;

  if (loading) return <AuthLoadingScreen />;
  if (requiresSignIn && !authenticated && !onSignInRoute) {
    return <Redirect href={"/sign-in" as any} />;
  }
  if (authenticated && onSignInRoute) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

/** Provide auth once around the complete Expo Router stack. */
export default function RootLayout() {
  return (
    <AuthProvider>
      <ProtectedStack />
    </AuthProvider>
  );
}
