/**
 * /settings route — renders the Main Settings screen.
 * Kept thin; all composition lives in MainSettingsScreen.
 */

import "@/theme/unistyles";
import { MainSettingsScreen } from "../../components/settings/MainSettingsScreen";

export default function SettingsRoute() {
  return <MainSettingsScreen />;
}
