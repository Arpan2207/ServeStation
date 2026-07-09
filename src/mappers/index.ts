/**
 * Barrel export for the mapping layer.
 *
 * Mappers convert between the prototype's per-screen view types and the
 * canonical domain model. The mock adapters use them to expose canonical reads,
 * and a future Supabase adapter will use the same functions (DB row → view or
 * DB row → canonical) so the boundary contract stays identical.
 */

export * from "./menuMappers";
export * from "./orderMappers";
