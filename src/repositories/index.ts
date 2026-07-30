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
import { createSupabaseMenuRepository } from "./adapters/supabase/menuSupabaseRepository";
import type { AdminRepository, MenuRepository, OrdersRepository } from "./types";

/**
 * True when both public Supabase env values are present. Used to select the
 * Supabase-backed adapters; without them the app falls back to mock data so it
 * still runs in environments that have not configured Supabase.
 */
const supabaseConfigured =
  !!process.env.EXPO_PUBLIC_SUPABASE_URL &&
  !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Active POS catalog repository. Uses Supabase when configured (Step 5:
 * catalog reads), otherwise the mock adapter.
 */
export const menuRepository: MenuRepository = supabaseConfigured
  ? createSupabaseMenuRepository()
  : createMockMenuRepository();

/** Active orders repository (mock-backed for now). */
export const ordersRepository: OrdersRepository = createMockOrdersRepository();

/** Active admin catalog repository (mock-backed for now). */
export const adminRepository: AdminRepository = createMockAdminRepository();

export type { AdminRepository, MenuRepository, OrdersRepository } from "./types";
