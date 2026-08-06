-- ============================================================================
-- ServeStation — Phase 3, Step 8: Supabase Auth, staff roles, and store RLS
-- ----------------------------------------------------------------------------
-- Run after 0001_init.sql, 0002_create_order.sql, and 0003_order_open_paid.sql.
-- Staff sign in with Supabase email/password Auth. Every active staff profile
-- belongs to exactly one store and has one of three first-release roles:
-- owner, manager, or cashier.
--
-- Direct client table writes are removed. Catalog and order rows are readable
-- only within the signed-in staff member's store. Order creation and status
-- changes remain available exclusively through the two validated RPCs.
-- ============================================================================

create type staff_role as enum ('owner', 'manager', 'cashier');

create table staff_profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  store_id     uuid not null references stores(id) on delete cascade,
  display_name text not null,
  role         staff_role not null default 'cashier',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index staff_profiles_store_id_idx on staff_profiles (store_id);

create trigger staff_profiles_set_updated_at
  before update on staff_profiles
  for each row execute function set_updated_at();

-- Existing Step 6/7 orders have a null staff_id. The constraint is NOT VALID so
-- unexpected legacy ids do not block rollout, while every new value is checked.
alter table orders
  add constraint orders_staff_profile_fk
  foreign key (staff_id) references staff_profiles(user_id) on delete set null
  not valid;

-- Security-definer policy helpers live outside the exposed public schema. They
-- bypass staff_profiles RLS without causing recursive policy evaluation.
create schema if not exists private;
revoke all on schema private from public;

create or replace function private.current_staff_store_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select profile.store_id
  from public.staff_profiles as profile
  where profile.user_id = (select auth.uid())
    and profile.is_active
$$;

create or replace function private.current_staff_role()
returns public.staff_role
language sql
stable
security definer
set search_path = ''
as $$
  select profile.role
  from public.staff_profiles as profile
  where profile.user_id = (select auth.uid())
    and profile.is_active
$$;

revoke all on function private.current_staff_store_id() from public;
revoke all on function private.current_staff_role() from public;
grant usage on schema private to authenticated;
grant execute on function private.current_staff_store_id() to authenticated;
grant execute on function private.current_staff_role() to authenticated;

-- Enable RLS on every table reachable through the Data API.
alter table stores enable row level security;
alter table staff_profiles enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_item_modifiers enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table modifier_groups enable row level security;
alter table modifier_options enable row level security;
alter table menu_item_modifier_groups enable row level security;

-- Store and staff profile visibility.
create policy "staff can read their store"
  on stores for select to authenticated
  using (id = (select private.current_staff_store_id()));

create policy "staff can read allowed profiles"
  on staff_profiles for select to authenticated
  using (
    store_id = (select private.current_staff_store_id())
    and (
      user_id = (select auth.uid())
      or (select private.current_staff_role()) in ('owner', 'manager')
    )
  );

-- Store-scoped catalog reads. Catalog writes remain disabled until Step 9.
create policy "staff can read store categories"
  on menu_categories for select to authenticated
  using (store_id = (select private.current_staff_store_id()));

create policy "staff can read store menu items"
  on menu_items for select to authenticated
  using (store_id = (select private.current_staff_store_id()));

create policy "staff can read store modifier groups"
  on modifier_groups for select to authenticated
  using (store_id = (select private.current_staff_store_id()));

create policy "staff can read store modifier options"
  on modifier_options for select to authenticated
  using (
    modifier_group_id in (
      select group_row.id
      from modifier_groups as group_row
      where group_row.store_id = (select private.current_staff_store_id())
    )
  );

create policy "staff can read store item modifier links"
  on menu_item_modifier_groups for select to authenticated
  using (
    menu_item_id in (
      select item.id
      from menu_items as item
      where item.store_id = (select private.current_staff_store_id())
    )
  );

-- Store-scoped order reads, including nested item and modifier snapshots.
create policy "staff can read store orders"
  on orders for select to authenticated
  using (store_id = (select private.current_staff_store_id()));

create policy "staff can read store order items"
  on order_items for select to authenticated
  using (
    order_id in (
      select order_row.id
      from orders as order_row
      where order_row.store_id = (select private.current_staff_store_id())
    )
  );

create policy "staff can read store order modifiers"
  on order_item_modifiers for select to authenticated
  using (
    order_item_id in (
      select item.id
      from order_items as item
      join orders as order_row on order_row.id = item.order_id
      where order_row.store_id = (select private.current_staff_store_id())
    )
  );

-- Restrict Data API table privileges to authenticated, read-only access. The
-- security-definer RPCs below are the only order write surface.
revoke all on stores, staff_profiles, orders, order_items,
  order_item_modifiers, menu_categories, menu_items, modifier_groups,
  modifier_options, menu_item_modifier_groups from anon, authenticated;

grant select on stores, staff_profiles, orders, order_items,
  order_item_modifiers, menu_categories, menu_items, modifier_groups,
  modifier_options, menu_item_modifier_groups to authenticated;

-- Recreate the guarded transition RPC with authenticated store ownership.
create or replace function apply_order_status_transition(
  p_order_id uuid,
  p_new_status order_status,
  p_reason text default null
)
returns orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order       public.orders;
  v_allowed     boolean;
  v_staff_store uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select private.current_staff_store_id() into v_staff_store;
  if v_staff_store is null then
    raise exception 'No active staff profile';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id and store_id = v_staff_store
  for update;

  if not found then
    raise exception 'Order % not found for current store', p_order_id;
  end if;

  v_allowed := case v_order.status
    when 'open' then p_new_status in ('paid', 'cancelled')
    else false
  end;

  if not v_allowed then
    raise exception 'Invalid order transition: % -> %', v_order.status, p_new_status;
  end if;

  if p_new_status = 'cancelled' and nullif(trim(p_reason), '') is null then
    raise exception 'Cancellation reason is required';
  end if;

  update public.orders
     set status              = p_new_status,
         paid_at             = case when p_new_status = 'paid' then now() else paid_at end,
         cancelled_at        = case when p_new_status = 'cancelled' then now() else cancelled_at end,
         cancellation_reason = case when p_new_status = 'cancelled' then trim(p_reason) else null end
   where id = p_order_id
   returning * into v_order;

  return v_order;
end;
$$;

-- Recreate atomic order creation. The current user/store are authoritative;
-- client-supplied store ids cannot cross store boundaries.
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
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item        jsonb;
  v_item_id     uuid;
  v_modifier    jsonb;
  v_status      public.order_status := coalesce(p_status, 'open');
  v_staff_store uuid;
  v_user_id     uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select private.current_staff_store_id() into v_staff_store;
  if v_staff_store is null then
    raise exception 'No active staff profile';
  end if;
  if p_store_id is not null and p_store_id <> v_staff_store then
    raise exception 'Cannot create an order for another store';
  end if;
  if v_status not in ('open', 'paid') then
    raise exception 'Orders can only be created as open or paid';
  end if;

  insert into public.orders (
    id, order_number, store_id, staff_id, fulfilment_type, status,
    customer_name, destination_label, note,
    subtotal, tax, discount, total,
    paid_at, created_at, updated_at
  ) values (
    p_order_id, p_order_number, v_staff_store, v_user_id, p_fulfilment_type, v_status,
    p_customer_name, p_destination_label, p_note,
    p_subtotal, p_tax, p_discount, p_total,
    case when v_status = 'paid' then coalesce(p_paid_at, now()) else null end,
    coalesce(p_created_at, now()), now()
  );

  for v_item in
    select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    insert into public.order_items (
      order_id, menu_item_id, name_snapshot, unit_price, quantity, note
    ) values (
      p_order_id,
      nullif(v_item->>'menu_item_id', '')::uuid,
      v_item->>'name_snapshot',
      (v_item->>'unit_price')::numeric,
      (v_item->>'quantity')::integer,
      nullif(v_item->>'note', '')
    ) returning id into v_item_id;

    for v_modifier in
      select * from jsonb_array_elements(coalesce(v_item->'modifiers', '[]'::jsonb))
    loop
      insert into public.order_item_modifiers (
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
$$;

revoke all on function apply_order_status_transition(uuid, order_status, text)
  from public, anon;
revoke all on function create_order(
  uuid, uuid, text, fulfilment_type, order_status, text, text, text,
  numeric, numeric, numeric, numeric, timestamptz, timestamptz, jsonb
) from public, anon;

grant execute on function apply_order_status_transition(uuid, order_status, text)
  to authenticated;
grant execute on function create_order(
  uuid, uuid, text, fulfilment_type, order_status, text, text, text,
  numeric, numeric, numeric, numeric, timestamptz, timestamptz, jsonb
) to authenticated;
