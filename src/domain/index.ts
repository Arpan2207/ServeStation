/**
 * Barrel export for the canonical ServeStation domain model.
 *
 * These are the app-owned, backend-facing entities. Screens continue to use
 * the lighter per-screen view types in `src/types/*`; the repository + mapper
 * layers translate between the two so the UI never depends on backend shapes
 * or mock-data quirks directly.
 */

export * from "./money";
export * from "./fulfilment";
export * from "./menu";
export * from "./orders";
