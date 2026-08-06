/**
 * Repository singletons — the app's single entry point for data access.
 *
 * Screens and hooks import `menuRepository`, `ordersRepository`,
 * `authRepository`, or `adminRepository` from here and depend only on the
 * interfaces in `./types`.
 * Environment configuration selects Supabase catalog, order, and auth adapters;
 * mock adapters preserve the zero-setup local workflow. Screens and hooks do
 * not change when the active backend changes.
 */

import { createMockAdminRepository } from "./adapters/mock/adminMockRepository";
import { createMockAuthRepository } from "./adapters/mock/authMockRepository";
import { createMockMenuRepository } from "./adapters/mock/menuMockRepository";
import { createMockOrdersRepository } from "./adapters/mock/ordersMockRepository";
import { createSupabaseMenuRepository } from "./adapters/supabase/menuSupabaseRepository";
import { createSupabaseOrdersRepository } from "./adapters/supabase/ordersSupabaseRepository";
import { createSupabaseAuthRepository } from "./adapters/supabase/authSupabaseRepository";
import type {
  AdminRepository,
  AuthRepository,
  MenuRepository,
  OrdersRepository,
} from "./types";

/**
 * True when both public Supabase env values are present. Used to select the
 * Supabase-backed adapters; without them the app falls back to mock data so it
 * still runs in environments that have not configured Supabase.
 */
export const supabaseConfigured =
  !!process.env.EXPO_PUBLIC_SUPABASE_URL &&
  !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Active POS catalog repository. Uses Supabase when configured (Step 5:
 * catalog reads), otherwise the mock adapter.
 */
export const menuRepository: MenuRepository = supabaseConfigured
  ? createSupabaseMenuRepository()
  : createMockMenuRepository();

/**
 * Active orders repository. Uses Supabase when configured (Step 7: order
 * creation, Open/Closed queue reads, and mark-paid / cancel all persist to
 * Supabase), otherwise the fully mock-backed adapter.
 */
export const ordersRepository: OrdersRepository = supabaseConfigured
  ? createSupabaseOrdersRepository()
  : createMockOrdersRepository();

/** Active authentication repository. Supabase mode requires staff sign-in. */
export const authRepository: AuthRepository = supabaseConfigured
  ? createSupabaseAuthRepository()
  : createMockAuthRepository();

/** Active admin catalog repository (mock-backed for now). */
export const adminRepository: AdminRepository = createMockAdminRepository();

export type {
  AdminRepository,
  AuthRepository,
  MenuRepository,
  OrdersRepository,
} from "./types";
