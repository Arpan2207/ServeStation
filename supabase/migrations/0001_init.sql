-- ============================================================================
-- ServeStation — Phase 3 initial Supabase schema
-- ----------------------------------------------------------------------------
-- This migration mirrors the canonical domain model in `src/domain/*`.
--
-- ORDER MODEL FIRST: orders are the highest-risk, longest-lived contract in the
-- product (lifecycle state, kitchen status, timestamps, payments, refunds,
-- reporting, future notifications). They are defined at the top of this file
-- and drive the rest of the schema. The catalog tables (categories, items,
-- modifiers) are created afterward, and the cross-table foreign keys from the
-- order tables into the catalog are attached at the end so the order model can
-- be read and reviewed first.
--
-- Money is stored as numeric(10,2) (raw dollars) — never formatted "$" strings.
-- Timestamps are timestamptz — UI phrases like "2 min ago" are computed in the
-- app, never stored. Line items snapshot name/price so catalog edits never
-- rewrite historical orders.
--
-- Auth / RLS is intentionally deferred (see the notes at the bottom). Adopt it
-- as a follow-up milestone once catalog reads and order writes are validated.
-- ============================================================================

create extension if not exists pgcrypto;

-- ── Enums (canonical domain values, snake_case) ────────────────────────────

create type fulfilment_type as enum ('dine_in', 'pickup', 'delivery');

create type order_lifecycle_status as enum (
  'draft', 'submitted', 'accepted', 'in_progress', 'ready', 'completed', 'cancelled'
);

create type kitchen_status as enum ('pending', 'queued', 'cooking', 'plated', 'served');

create type payment_status as enum (
  'unpaid', 'pending', 'paid', 'refunded', 'partially_refunded'
);

create type payment_method as enum ('cash', 'card', 'wallet', 'other');

create type catalog_visibility as enum ('visible', 'draft');

-- Shared trigger to keep updated_at fresh on any row update.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- SECTION 1 — ORDERS (designed first; the core operational contract)
-- ============================================================================

-- A store/location. Kept minimal now; expands with multi-store + auth later.
create table stores (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger stores_set_updated_at
  before update on stores
  for each row execute function set_updated_at();

-- Orders — the aggregate root. Mirrors `Order` in src/domain/orders.ts.
create table orders (
  id                  uuid primary key default gen_random_uuid(),
  -- Human-friendly, per-store sequential/prefixed number shown to staff.
  order_number        text not null,
  store_id            uuid references stores(id) on delete set null,
  -- staff_id is a plain uuid for now; a FK to a profiles table is added when
  -- auth lands (see notes). Keeping it nullable avoids blocking order writes.
  staff_id            uuid,

  fulfilment_type     fulfilment_type not null,
  lifecycle_status    order_lifecycle_status not null default 'submitted',
  kitchen_status      kitchen_status not null default 'pending',

  customer_name       text,
  destination_label   text,

  payment_status      payment_status not null default 'unpaid',
  payment_method      payment_method,
  payment_reference   text,

  -- Money as raw numeric values; total is stored explicitly for reporting and
  -- should satisfy: total = subtotal + tax - discount - refund_total.
  subtotal            numeric(10,2) not null default 0,
  tax                 numeric(10,2) not null default 0,
  discount            numeric(10,2) not null default 0,
  refund_total        numeric(10,2) not null default 0,
  total               numeric(10,2) not null default 0,

  note                text,
  cancellation_reason text,
  refund_reason       text,

  -- Lifecycle milestone timestamps; only reached milestones are set.
  submitted_at        timestamptz,
  accepted_at         timestamptz,
  started_at          timestamptz,
  ready_at            timestamptz,
  completed_at        timestamptz,
  cancelled_at        timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (store_id, order_number)
);

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

create index orders_store_lifecycle_idx on orders (store_id, lifecycle_status);
create index orders_created_at_idx on orders (created_at desc);

-- Order line items. Snapshot name/price so historical orders never change when
-- the catalog is edited. menu_item_id is a soft reference (FK added at the end).
create table order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  menu_item_id   uuid,
  name_snapshot  text not null,
  unit_price     numeric(10,2) not null default 0,
  quantity       integer not null default 1 check (quantity > 0),
  note           text,
  created_at     timestamptz not null default now()
);

create index order_items_order_id_idx on order_items (order_id);

-- Per-line modifier selections, snapshotted at order time.
create table order_item_modifiers (
  id                 uuid primary key default gen_random_uuid(),
  order_item_id      uuid not null references order_items(id) on delete cascade,
  modifier_option_id uuid,
  label              text not null,
  price_delta        numeric(10,2) not null default 0
);

create index order_item_modifiers_item_idx on order_item_modifiers (order_item_id);

-- Optional (future): an append-only event log for order state transitions and
-- customer notifications. Left commented so the first slice stays focused.
-- create table order_events (
--   id          uuid primary key default gen_random_uuid(),
--   order_id    uuid not null references orders(id) on delete cascade,
--   event_type  text not null,
--   payload     jsonb,
--   created_at  timestamptz not null default now()
-- );

-- ============================================================================
-- SECTION 2 — CATALOG (menu categories, items, modifiers)
-- ============================================================================

-- Mirrors `MenuCategory` in src/domain/menu.ts.
create table menu_categories (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid references stores(id) on delete cascade,
  name        text not null,
  -- Display ordering for the category bar.
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger menu_categories_set_updated_at
  before update on menu_categories
  for each row execute function set_updated_at();

-- Mirrors `MenuItem` in src/domain/menu.ts.
create table menu_items (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid references stores(id) on delete cascade,
  category_id   uuid references menu_categories(id) on delete set null,
  name          text not null,
  description   text not null default '',
  price         numeric(10,2) not null default 0,
  -- Merchandising flag (curated "Popular" view), NOT a category row.
  is_popular    boolean not null default false,
  is_available  boolean not null default true,
  visibility    catalog_visibility not null default 'visible',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger menu_items_set_updated_at
  before update on menu_items
  for each row execute function set_updated_at();

create index menu_items_category_idx on menu_items (category_id);

-- Mirrors `ModifierGroup` in src/domain/menu.ts.
create table modifier_groups (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid references stores(id) on delete cascade,
  label       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger modifier_groups_set_updated_at
  before update on modifier_groups
  for each row execute function set_updated_at();

-- Mirrors `ModifierOption` in src/domain/menu.ts.
create table modifier_options (
  id                uuid primary key default gen_random_uuid(),
  modifier_group_id uuid not null references modifier_groups(id) on delete cascade,
  label             text not null,
  price_delta       numeric(10,2) not null default 0,
  sort_order        integer not null default 0
);

create index modifier_options_group_idx on modifier_options (modifier_group_id);

-- Join table: which modifier groups apply to which items.
create table menu_item_modifier_groups (
  menu_item_id      uuid not null references menu_items(id) on delete cascade,
  modifier_group_id uuid not null references modifier_groups(id) on delete cascade,
  primary key (menu_item_id, modifier_group_id)
);

-- ============================================================================
-- SECTION 3 — Cross-table links from ORDERS into CATALOG
-- ----------------------------------------------------------------------------
-- Added last (after catalog tables exist) so the order model above can be read
-- first. These are ON DELETE SET NULL because deleting a catalog row must never
-- destroy or rewrite a historical order line (name/price are snapshotted).
-- ============================================================================

alter table order_items
  add constraint order_items_menu_item_fk
  foreign key (menu_item_id) references menu_items(id) on delete set null;

alter table order_item_modifiers
  add constraint order_item_modifiers_option_fk
  foreign key (modifier_option_id) references modifier_options(id) on delete set null;

-- ============================================================================
-- NOTES — deferred for later milestones
-- ----------------------------------------------------------------------------
-- 1. Auth / RLS: add `profiles`/`staff_profiles` (linked to auth.users), a FK
--    from orders.staff_id, and enable Row Level Security with store-scoped
--    policies. Deferred so catalog reads + order writes can be validated first.
-- 2. Payments: `payment_reference` holds an external provider id; a dedicated
--    `payments` table can be introduced when a real processor is integrated.
-- 3. Notifications: use the commented `order_events` table (or a dedicated
--    `order_notifications` table) rather than adding UI-derived flags to orders.
-- 4. Reporting: query raw numeric money + timestamptz columns; never persist
--    formatted strings ("$13.50") or relative phrases ("2 min ago").
-- ============================================================================
