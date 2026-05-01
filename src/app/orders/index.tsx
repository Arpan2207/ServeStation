/**
 * /orders route — renders the Orders List screen.
 * Kept thin; all composition lives in OrdersListScreen.
 */

import "@/theme/unistyles";
import { OrdersListScreen } from "../../components/orders/OrdersListScreen";

export default function OrdersRoute() {
  return <OrdersListScreen />;
}
