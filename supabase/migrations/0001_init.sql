-- ============================================================================
-- ServeStation (Tablecraft) — Phase 3 initial Supabase schema
-- ----------------------------------------------------------------------------
-- This migration mirrors the canonical domain model in `src/domain/*`.
--
-- ORDER MODEL FIRST: orders are the highest-risk, longest-lived contract in the
-- product (status, timestamps, reporting, future payments/notifications). They
-- are defined at the top of this file and drive the rest of the schema. The
-- catalog tables (categories, items, modifiers) are created afterward, and the
-- cross-table foreign keys from the order tables into the catalog are attached
-- at the end so the order model can be read and reviewed first.
--
-- FIRST-RELEASE CONTRACT (locked; see docs/order-lifecycle.md):
--   * Carts stay device-local; a `draft` order is NEVER persisted. An order row
--     is created only on "Place order" and enters as `submitted`.
--   * A single status machine drives the queue:
--         submitted → preparing → ready → completed
--                               ↘ cancelled
--   * Payments and refunds are DEFERRED to a later migration/phase — there are
--     no payment/refund columns here (see notes at the bottom).
--
-- Money is stored as numeric(10,2) (raw dollars) — never formatted "$" strings.
-- Timestamps are timestamptz — UI phrases like "2 min ago" are computed in the
-- app, never stored. Line items snapshot name/price so catalog edits never
-- rewrite historical orders.
--
-- Auth / RLS is intentionally deferred (see the notes at the bottom).
-- ============================================================================

create extension if not exists pgcrypto;

-- ── Enums (canonical domain values, snake_case) ────────────────────────────

create type fulfilment_type as enum ('dine_in', 'pickup', 'delivery');

-- Single operational status. No `draft` (carts are local) and no separate
-- kitchen state machine (one status is the queue truth).
create type order_status as enum (
  'submitted', 'preparing', 'ready', 'completed', 'cancelled'
);

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
  -- Orders always enter as 'submitted' (carts are never persisted as drafts).
  status              order_status not null default 'submitted',

  customer_name       text,
  destination_label   text,

  -- Money as raw numeric values; total is stored explicitly for reporting.
  -- First-release invariant (payments deferred): total = subtotal + tax - discount.
  subtotal            numeric(10,2) not null default 0 check (subtotal >= 0),
  tax                 numeric(10,2) not null default 0 check (tax >= 0),
  discount            numeric(10,2) not null default 0 check (discount >= 0),
  total               numeric(10,2) not null default 0 check (total >= 0),
  constraint orders_total_consistent
    check (total = subtotal + tax - discount),

  note                text,
  cancellation_reason text,
  -- Cancellation must carry a reason; other states must not pretend to have one.
  constraint orders_cancellation_reason_only_when_cancelled check (
    (status = 'cancelled' and cancellation_reason is not null)
    or (status <> 'cancelled' and cancellation_reason is null)
  ),

  -- Lifecycle milestone timestamps; only reached milestones are set.
  submitted_at        timestamptz,
  preparing_at        timestamptz,
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

-- Operational indexes for the real queries this app runs.
-- Store queue filtered by status + recency (Open/Closed lists).
create index orders_store_status_created_idx
  on orders (store_id, status, created_at desc);
create index orders_created_at_idx on orders (created_at desc);
-- Partial index for the hot "active queue" reads (submitted/preparing/ready).
create index orders_active_queue_idx
  on orders (store_id, created_at desc)
  where status in ('submitted', 'preparing', 'ready');

-- Guarded status transition. The UI must call this function (or an RPC wrapping
-- it) rather than issuing arbitrary UPDATEs, so invalid moves such as
-- completed → preparing can never be written. It also stamps the milestone
-- timestamp for the target status. Keep this in sync with
-- ORDER_STATUS_TRANSITIONS / TIMESTAMP_FIELD_FOR_STATUS in src/domain/orders.ts.
create or replace function apply_order_status_transition(
  p_order_id uuid,
  p_new_status order_status,
  p_reason text default null
)
returns orders as $$
declare
  v_order   orders;
  v_allowed boolean;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;

  v_allowed := case v_order.status
    when 'submitted' then p_new_status in ('preparing', 'cancelled')
    when 'preparing' then p_new_status in ('ready', 'cancelled')
    when 'ready'     then p_new_status in ('completed', 'cancelled')
    else false -- completed / cancelled are terminal
  end;

  if not v_allowed then
    raise exception 'Invalid order transition: % -> %', v_order.status, p_new_status;
  end if;

  update orders
     set status              = p_new_status,
         preparing_at        = case when p_new_status = 'preparing' then now() else preparing_at end,
         ready_at            = case when p_new_status = 'ready'     then now() else ready_at end,
         completed_at        = case when p_new_status = 'completed' then now() else completed_at end,
         cancelled_at        = case when p_new_status = 'cancelled' then now() else cancelled_at end,
         cancellation_reason = case when p_new_status = 'cancelled' then p_reason else cancellation_reason end
   where id = p_order_id
   returning * into v_order;

  return v_order;
end;
$$ language plpgsql;

-- Order line items. Snapshot name/price so historical orders never change when
-- the catalog is edited. menu_item_id is a soft reference (FK added at the end).
create table order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  menu_item_id   uuid,
  name_snapshot  text not null,
  unit_price     numeric(10,2) not null default 0 check (unit_price >= 0),
  quantity       integer not null default 1 check (quantity > 0),
  note           text,
  created_at     timestamptz not null default now()
);

create index order_items_order_id_idx on order_items (order_id);

-- Per-line modifier selections, snapshotted at order time. price_delta is
-- intentionally unconstrained in sign so future discount-style modifiers work.
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
  price         numeric(10,2) not null default 0 check (price >= 0),
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
-- 2. Payments (DEFERRED — not in first release): introduce a dedicated
--    `payments` table (processor/cash records, linked to orders.id) rather than
--    columns on `orders`. Do not add `payment_status`/`payment_reference` back
--    to `orders`; keep payment history append-only in its own table.
-- 3. Refunds (DEFERRED): introduce `refunds` / `order_adjustments` as an
--    append-only partial-refund history joined to the final order id. A single
--    `refund_total` column is intentionally NOT used (it hides real history).
-- 4. Notifications: use the commented `order_events` table (or a dedicated
--    `order_notifications` table) rather than adding UI-derived flags to orders.
-- 5. Reporting: query raw numeric money + timestamptz columns; never persist
--    formatted strings ("$13.50") or relative phrases ("2 min ago").
-- 6. Status changes: write via apply_order_status_transition() (or an RPC that
--    wraps it), never via arbitrary UPDATEs, so invalid transitions are refused.
-- ============================================================================
