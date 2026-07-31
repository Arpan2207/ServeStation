-- ============================================================================
-- ServeStation — Phase 3, Step 7: simplify the order status model
-- ----------------------------------------------------------------------------
-- The kitchen workflow (submitted → preparing → ready → completed) is dropped
-- for now in favour of a minimal, payment-driven model:
--
--     open      → saved but not paid   (Open orders queue)
--     paid      → paid & closed        (Closed orders queue)
--     cancelled → voided & closed      (Closed orders queue)
--
-- "Charge" creates an order directly as `paid`; "Save" creates it as `open`.
-- An `open` order can later be marked `paid` or `cancelled`.
--
-- This migration:
--   1. Drops the objects that pin the old enum / timestamp columns.
--   2. Rewrites the `order_status` enum to ('open', 'paid', 'cancelled') and
--      maps existing rows (completed → paid, cancelled → cancelled, else open).
--   3. Reworks the lifecycle timestamp columns (completed_at → paid_at; drops
--      submitted_at / preparing_at / ready_at).
--   4. Recreates the active-queue index for `status = 'open'`.
--   5. Recreates `apply_order_status_transition` and `create_order` for the new
--      model (create_order now takes a status + paid_at).
--
-- Run this in the Supabase SQL Editor after 0001_init.sql and 0002_create_order.sql.
-- Keep in sync with ORDER_STATUS_TRANSITIONS / TIMESTAMP_FIELD_FOR_STATUS in
-- src/domain/orders.ts.
-- ============================================================================

-- 1. Drop objects that depend on the old enum values / timestamp columns.
drop index if exists orders_active_queue_idx;
drop function if exists apply_order_status_transition(uuid, order_status, text);
drop function if exists create_order(
  uuid, uuid, text, fulfilment_type, text, text, text,
  numeric, numeric, numeric, numeric, timestamptz, timestamptz, jsonb
);

-- 2. Rewrite the enum and remap existing rows.
--    The cancellation-reason CHECK references `status` (and the literal
--    'cancelled'), which is bound to the old enum. It must be dropped before the
--    type swap — otherwise re-checking it compares the new column against the
--    old-typed literal (ERROR: operator does not exist: order_status =
--    order_status_old) — and re-added afterwards, bound to the new type.
alter table orders
  drop constraint if exists orders_cancellation_reason_only_when_cancelled;

alter table orders alter column status drop default;
alter type order_status rename to order_status_old;
create type order_status as enum ('open', 'paid', 'cancelled');

alter table orders
  alter column status type order_status
  using (
    case status::text
      when 'completed' then 'paid'
      when 'cancelled' then 'cancelled'
      else 'open' -- submitted / preparing / ready all become open
    end
  )::order_status;

alter table orders alter column status set default 'open';
drop type order_status_old;

-- Re-add the cancellation-reason CHECK, now bound to the new enum.
alter table orders
  add constraint orders_cancellation_reason_only_when_cancelled check (
    (status = 'cancelled' and cancellation_reason is not null)
    or (status <> 'cancelled' and cancellation_reason is null)
  );

-- 3. Rework lifecycle timestamp columns.
--    completed_at carried the "closed" moment, which is now the paid moment.
alter table orders rename column completed_at to paid_at;
alter table orders drop column if exists submitted_at;
alter table orders drop column if exists preparing_at;
alter table orders drop column if exists ready_at;

-- 4. Recreate the hot "active queue" partial index for the new open status.
create index orders_active_queue_idx
  on orders (store_id, created_at desc)
  where status = 'open';

-- 5a. Guarded status transition for the new model. The UI must call this (or an
--     RPC wrapping it) rather than issuing arbitrary UPDATEs. `open` is the only
--     non-terminal status; `paid` / `cancelled` are terminal.
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
    when 'open' then p_new_status in ('paid', 'cancelled')
    else false -- paid / cancelled are terminal
  end;

  if not v_allowed then
    raise exception 'Invalid order transition: % -> %', v_order.status, p_new_status;
  end if;

  update orders
     set status              = p_new_status,
         paid_at             = case when p_new_status = 'paid'      then now() else paid_at end,
         cancelled_at        = case when p_new_status = 'cancelled' then now() else cancelled_at end,
         cancellation_reason = case when p_new_status = 'cancelled' then p_reason else cancellation_reason end
   where id = p_order_id
   returning * into v_order;

  return v_order;
end;
$$ language plpgsql;

-- 5b. Atomic order creation for the new model. Inserts the order (as `open` or
--     `paid`) plus its line items and per-line modifiers in one transaction.
create or replace function create_order(
  p_order_id          uuid,
  p_store_id          uuid,
  p_order_number      text,
  p_fulfilment_type   fulfilment_type,
  p_status            order_status,
  p_customer_name     text,
  p_destination_label text,
  p_note              text,
  p_subtotal          numeric,
  p_tax               numeric,
  p_discount          numeric,
  p_total             numeric,
  p_created_at        timestamptz,
  p_paid_at           timestamptz,
  p_items             jsonb
)
returns uuid as $$
declare
  v_item      jsonb;
  v_item_id   uuid;
  v_modifier  jsonb;
  v_status    order_status := coalesce(p_status, 'open');
begin
  insert into orders (
    id, order_number, store_id, fulfilment_type, status,
    customer_name, destination_label, note,
    subtotal, tax, discount, total,
    paid_at, created_at, updated_at
  ) values (
    p_order_id, p_order_number, p_store_id, p_fulfilment_type, v_status,
    p_customer_name, p_destination_label, p_note,
    p_subtotal, p_tax, p_discount, p_total,
    case when v_status = 'paid' then coalesce(p_paid_at, now()) else null end,
    coalesce(p_created_at, now()), now()
  );

  -- Insert each line item, then its modifier snapshots. Item/modifier ids are
  -- generated by the DB; name/price are snapshots so catalog edits never rewrite
  -- this order.
  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    insert into order_items (
      order_id, menu_item_id, name_snapshot, unit_price, quantity, note
    ) values (
      p_order_id,
      nullif(v_item->>'menu_item_id', '')::uuid,
      v_item->>'name_snapshot',
      (v_item->>'unit_price')::numeric,
      (v_item->>'quantity')::integer,
      nullif(v_item->>'note', '')
    )
    returning id into v_item_id;

    for v_modifier in
      select * from jsonb_array_elements(coalesce(v_item->'modifiers', '[]'::jsonb))
    loop
      insert into order_item_modifiers (
        order_item_id, modifier_option_id, label, price_delta
      ) values (
        v_item_id,
        nullif(v_modifier->>'modifier_option_id', '')::uuid,
        v_modifier->>'label',
        (v_modifier->>'price_delta')::numeric
      );
    end loop;
  end loop;

  return p_order_id;
end;
$$ language plpgsql;

-- 6. Re-grant execute to the app roles (dropping/recreating a function drops its
--    grants). Reads use table privileges already granted to these roles.
grant execute on function apply_order_status_transition(uuid, order_status, text)
  to anon, authenticated;
grant execute on function create_order(
  uuid, uuid, text, fulfilment_type, order_status, text, text, text,
  numeric, numeric, numeric, numeric, timestamptz, timestamptz, jsonb
) to anon, authenticated;
