/**
 * Repository singletons — the app's single entry point for data access.
 *
 * Screens and hooks import `menuRepository` / `ordersRepository` /
 * `adminRepository` from here and depend only on the interfaces in `./types`.
 * Today these are wired to the mock adapters; adopting Supabase later means
 * swapping the factory calls below (or selecting an adapter by env) — no screen
 * or hook has to change.
 */

import { createMockAdminRepository } from "./adapters/mock/adminMockRepository";
import { createMockMenuRepository } from "./adapters/mock/menuMockRepository";
import { createMockOrdersRepository } from "./adapters/mock/ordersMockRepository";
import type { AdminRepository, MenuRepository, OrdersRepository } from "./types";

/** Active POS catalog repository (mock-backed for now). */
export const menuRepository: MenuRepository = createMockMenuRepository();

/** Active orders repository (mock-backed for now). */
export const ordersRepository: OrdersRepository = createMockOrdersRepository();

/** Active admin catalog repository (mock-backed for now). */
export const adminRepository: AdminRepository = createMockAdminRepository();

export type { AdminRepository, MenuRepository, OrdersRepository } from "./types";
