/**
 * /settings/ui route — renders the UI Settings screen.
 * Kept thin; all composition lives in UiSettingsScreen.
 */

import "@/theme/unistyles";
import { UiSettingsScreen } from "../../components/settings/UiSettingsScreen";

export default function UiSettingsRoute() {
  return <UiSettingsScreen />;
}
