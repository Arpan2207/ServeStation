-- ============================================================================
-- ServeStation — Step 9 Admin catalog mutations
-- ----------------------------------------------------------------------------
-- Owner/manager catalog writes remain store-scoped. Cashiers keep the catalog
-- SELECT access granted in 0004 but cannot insert, update, delete, or execute
-- the guarded mutation functions below.
-- ============================================================================

-- PostgREST needs table privileges in addition to RLS policies. The policies
-- below are authoritative for both role and store ownership.
grant insert, update, delete on
  menu_categories, menu_items, modifier_groups, modifier_options,
  menu_item_modifier_groups
to authenticated;

create policy "managers can mutate store categories"
  on menu_categories for all to authenticated
  using (
    store_id = (select private.current_staff_store_id())
    and (select private.current_staff_role()) in ('owner', 'manager')
  )
  with check (
    store_id = (select private.current_staff_store_id())
    and (select private.current_staff_role()) in ('owner', 'manager')
  );

create policy "managers can mutate store menu items"
  on menu_items for all to authenticated
  using (
    store_id = (select private.current_staff_store_id())
    and (select private.current_staff_role()) in ('owner', 'manager')
  )
  with check (
    store_id = (select private.current_staff_store_id())
    and category_id in (
      select category.id
      from menu_categories as category
      where category.store_id = (select private.current_staff_store_id())
    )
    and (select private.current_staff_role()) in ('owner', 'manager')
  );

create policy "managers can mutate store modifier groups"
  on modifier_groups for all to authenticated
  using (
    store_id = (select private.current_staff_store_id())
    and (select private.current_staff_role()) in ('owner', 'manager')
  )
  with check (
    store_id = (select private.current_staff_store_id())
    and (select private.current_staff_role()) in ('owner', 'manager')
  );

create policy "managers can mutate store modifier options"
  on modifier_options for all to authenticated
  using (
    modifier_group_id in (
      select group_row.id
      from modifier_groups as group_row
      where group_row.store_id = (select private.current_staff_store_id())
    )
    and (select private.current_staff_role()) in ('owner', 'manager')
  )
  with check (
    modifier_group_id in (
      select group_row.id
      from modifier_groups as group_row
      where group_row.store_id = (select private.current_staff_store_id())
    )
    and (select private.current_staff_role()) in ('owner', 'manager')
  );

create policy "managers can mutate store modifier links"
  on menu_item_modifier_groups for all to authenticated
  using (
    menu_item_id in (
      select item.id
      from menu_items as item
      where item.store_id = (select private.current_staff_store_id())
    )
    and modifier_group_id in (
      select group_row.id
      from modifier_groups as group_row
      where group_row.store_id = (select private.current_staff_store_id())
    )
    and (select private.current_staff_role()) in ('owner', 'manager')
  )
  with check (
    menu_item_id in (
      select item.id
      from menu_items as item
      where item.store_id = (select private.current_staff_store_id())
    )
    and modifier_group_id in (
      select group_row.id
      from modifier_groups as group_row
      where group_row.store_id = (select private.current_staff_store_id())
    )
    and (select private.current_staff_role()) in ('owner', 'manager')
  );

-- Delete a category and its live catalog items atomically. order_items uses
-- ON DELETE SET NULL and retains name_snapshot/unit_price, so order history is
-- not rewritten or removed.
create or replace function delete_catalog_category(p_category_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store_id     uuid;
  v_group_ids    uuid[];
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if (select private.current_staff_role()) is null
     or (select private.current_staff_role()) not in ('owner', 'manager') then
    raise exception 'Owner or manager access required';
  end if;

  select private.current_staff_store_id() into v_store_id;
  if not exists (
    select 1 from public.menu_categories
    where id = p_category_id and store_id = v_store_id
  ) then
    raise exception 'Category not found for current store';
  end if;

  select coalesce(array_agg(distinct link.modifier_group_id), array[]::uuid[])
    into v_group_ids
  from public.menu_item_modifier_groups as link
  join public.menu_items as item on item.id = link.menu_item_id
  where item.category_id = p_category_id and item.store_id = v_store_id;

  delete from public.menu_items
  where category_id = p_category_id and store_id = v_store_id;

  delete from public.menu_categories
  where id = p_category_id and store_id = v_store_id;

  delete from public.modifier_groups as group_row
  where group_row.id = any(v_group_ids)
    and group_row.store_id = v_store_id
    and not exists (
      select 1 from public.menu_item_modifier_groups as link
      where link.modifier_group_id = group_row.id
    );
end;
$$;

-- Replace the selected item's visible modifier choices in one transaction.
-- A dedicated group avoids changing options shared by other menu items.
create or replace function replace_item_modifier_options(
  p_item_id uuid,
  p_options jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store_id      uuid;
  v_item_name     text;
  v_group_id      uuid;
  v_old_group_ids uuid[];
  v_option        jsonb;
  v_index         integer := 0;
  v_options       jsonb := coalesce(p_options, '[]'::jsonb);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if (select private.current_staff_role()) is null
     or (select private.current_staff_role()) not in ('owner', 'manager') then
    raise exception 'Owner or manager access required';
  end if;
  if jsonb_typeof(v_options) <> 'array' then
    raise exception 'Modifier options must be a JSON array';
  end if;
  if jsonb_array_length(v_options) > 6 then
    raise exception 'A menu item can have at most six modifier options';
  end if;

  select private.current_staff_store_id() into v_store_id;
  select name into v_item_name
  from public.menu_items
  where id = p_item_id and store_id = v_store_id
  for update;
  if not found then
    raise exception 'Menu item not found for current store';
  end if;

  select coalesce(array_agg(modifier_group_id), array[]::uuid[])
    into v_old_group_ids
  from public.menu_item_modifier_groups
  where menu_item_id = p_item_id;

  delete from public.menu_item_modifier_groups where menu_item_id = p_item_id;

  if jsonb_array_length(v_options) > 0 then
    insert into public.modifier_groups (store_id, label)
    values (v_store_id, v_item_name || ' modifiers')
    returning id into v_group_id;

    insert into public.menu_item_modifier_groups (menu_item_id, modifier_group_id)
    values (p_item_id, v_group_id);

    for v_option in select * from jsonb_array_elements(v_options)
    loop
      if nullif(trim(v_option->>'label'), '') is null then
        raise exception 'Every modifier option needs a name';
      end if;
      if (v_option->>'price_delta')::numeric < 0 then
        raise exception 'Modifier prices cannot be negative';
      end if;

      insert into public.modifier_options (
        modifier_group_id, label, price_delta, sort_order
      ) values (
        v_group_id,
        trim(v_option->>'label'),
        round((v_option->>'price_delta')::numeric, 2),
        v_index
      );
      v_index := v_index + 1;
    end loop;
  end if;

  -- Remove only groups that became unused. Shared seeded groups survive while
  -- another item still references them.
  delete from public.modifier_groups as group_row
  where group_row.id = any(v_old_group_ids)
    and group_row.store_id = v_store_id
    and not exists (
      select 1 from public.menu_item_modifier_groups as link
      where link.modifier_group_id = group_row.id
    );
end;
$$;

revoke all on function delete_catalog_category(uuid) from public, anon;
revoke all on function replace_item_modifier_options(uuid, jsonb) from public, anon;
grant execute on function delete_catalog_category(uuid) to authenticated;
grant execute on function replace_item_modifier_options(uuid, jsonb) to authenticated;
