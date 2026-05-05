/**
 * /admin route — renders the Admin workspace screen.
 * Kept thin; all composition lives in AdminScreen.
 */

import "@/theme/unistyles";
import { AdminScreen } from "../../components/admin/AdminScreen";

export default function AdminRoute() {
  return <AdminScreen />;
}
