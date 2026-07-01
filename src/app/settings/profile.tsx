/**
 * /settings/profile route - renders the Profile Settings screen.
 * Kept thin; all composition lives in ProfileSettingsScreen.
 */

import "@/theme/unistyles";
import { ProfileSettingsScreen } from "../../components/settings/ProfileSettingsScreen";

/**
 * Route entry for the profile settings screen.
 */
export default function ProfileSettingsRoute() {
  return <ProfileSettingsScreen />;
}
