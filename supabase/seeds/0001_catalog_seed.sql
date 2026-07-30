-- ============================================================================
-- ServeStation — catalog seed (Phase 3, Step 5)
-- ----------------------------------------------------------------------------
-- Populates the store + catalog tables with the same data the app previously
-- served from src/lib/mockData.ts, so the Supabase-backed MenuRepository can
-- return an identical POS catalog.
--
-- Safe to re-run: every row uses a deterministic UUID derived from a natural
-- key via md5(...)::uuid, and every insert upserts on conflict. Run this in the
-- Supabase SQL Editor AFTER 0001_init.sql has succeeded.
--
-- Note: the curated "Popular" category is NOT a row here — it is derived in the
-- app from menu_items.is_popular. Tax rate is a client-side constant for now
-- (no config table yet).
-- ============================================================================

begin;

-- ── Store ──────────────────────────────────────────────────────────────────
insert into stores (id, name)
values (md5('store:servestation-main')::uuid, 'ServeStation Main')
on conflict (id) do update set name = excluded.name;

-- ── Categories (sort_order drives the category bar order) ───────────────────
insert into menu_categories (id, store_id, name, sort_order) values
  (md5('cat:burgers')::uuid,  md5('store:servestation-main')::uuid, 'Burgers',  1),
  (md5('cat:bowls')::uuid,    md5('store:servestation-main')::uuid, 'Bowls',    2),
  (md5('cat:sides')::uuid,    md5('store:servestation-main')::uuid, 'Sides',    3),
  (md5('cat:drinks')::uuid,   md5('store:servestation-main')::uuid, 'Drinks',   4),
  (md5('cat:desserts')::uuid, md5('store:servestation-main')::uuid, 'Desserts', 5)
on conflict (id) do update
  set name = excluded.name, sort_order = excluded.sort_order;

-- ── Menu items ─────────────────────────────────────────────────────────────
insert into menu_items
  (id, store_id, category_id, name, description, price, is_popular) values
  (md5('item:smash-burger')::uuid,      md5('store:servestation-main')::uuid, md5('cat:burgers')::uuid,
     'Smash Burger',       'Double patty, cheddar, pickles, house sauce.',        13.50, true),
  (md5('item:hot-honey-chicken')::uuid, md5('store:servestation-main')::uuid, md5('cat:burgers')::uuid,
     'Hot Honey Chicken',  'Crispy chicken, slaw, chili honey glaze.',            14.25, true),
  (md5('item:green-bowl')::uuid,        md5('store:servestation-main')::uuid, md5('cat:bowls')::uuid,
     'Green Bowl',         'Rice, avocado, greens, roasted vegetables.',          11.75, true),
  (md5('item:chicken-wrap')::uuid,      md5('store:servestation-main')::uuid, md5('cat:bowls')::uuid,
     'Chicken Wrap',       'Grilled chicken, greens, and aioli in a soft wrap.',  11.90, false),
  (md5('item:classic-fries')::uuid,     md5('store:servestation-main')::uuid, md5('cat:sides')::uuid,
     'Classic Fries',      'Crispy fries with sea salt and herb seasoning.',       6.50, false),
  (md5('item:onion-rings')::uuid,       md5('store:servestation-main')::uuid, md5('cat:sides')::uuid,
     'Onion Rings',        'Beer-battered rings with smoky dip.',                  5.25, false),
  (md5('item:sparkling-lime')::uuid,    md5('store:servestation-main')::uuid, md5('cat:drinks')::uuid,
     'Sparkling Lime',     'Fresh citrus soda with mint and crushed ice.',         4.25, true),
  (md5('item:iced-coffee')::uuid,       md5('store:servestation-main')::uuid, md5('cat:drinks')::uuid,
     'Iced Coffee',        'Cold brew over ice with a splash of cream.',           3.75, false),
  (md5('item:choco-brownie')::uuid,     md5('store:servestation-main')::uuid, md5('cat:desserts')::uuid,
     'Choco Brownie',      'Warm fudge brownie with sea salt.',                    5.50, false)
on conflict (id) do update set
  category_id = excluded.category_id,
  name        = excluded.name,
  description = excluded.description,
  price       = excluded.price,
  is_popular  = excluded.is_popular;

-- ── Modifier groups ────────────────────────────────────────────────────────
insert into modifier_groups (id, store_id, label) values
  (md5('mg:burger')::uuid, md5('store:servestation-main')::uuid, 'Burger customizations'),
  (md5('mg:bowl')::uuid,   md5('store:servestation-main')::uuid, 'Bowl customizations'),
  (md5('mg:drink')::uuid,  md5('store:servestation-main')::uuid, 'Drink customizations')
on conflict (id) do update set label = excluded.label;

-- ── Modifier options ───────────────────────────────────────────────────────
insert into modifier_options
  (id, modifier_group_id, label, price_delta, sort_order) values
  (md5('mo:no-onions')::uuid,     md5('mg:burger')::uuid, 'No onions',        0.00, 1),
  (md5('mo:extra-pickles')::uuid, md5('mg:burger')::uuid, 'Extra pickles',    0.50, 2),
  (md5('mo:gf-bun')::uuid,        md5('mg:burger')::uuid, 'Gluten-free bun',  1.50, 3),
  (md5('mo:no-feta')::uuid,       md5('mg:bowl')::uuid,   'No feta',          0.00, 1),
  (md5('mo:extra-avocado')::uuid, md5('mg:bowl')::uuid,   'Extra avocado',    1.25, 2),
  (md5('mo:add-chicken')::uuid,   md5('mg:bowl')::uuid,   'Add chicken',      2.50, 3),
  (md5('mo:large-size')::uuid,    md5('mg:drink')::uuid,  'Large size',       1.00, 1),
  (md5('mo:extra-ice')::uuid,     md5('mg:drink')::uuid,  'Extra ice',        0.00, 2)
on conflict (id) do update set
  modifier_group_id = excluded.modifier_group_id,
  label             = excluded.label,
  price_delta       = excluded.price_delta,
  sort_order        = excluded.sort_order;

-- ── Item ↔ modifier group links ────────────────────────────────────────────
insert into menu_item_modifier_groups (menu_item_id, modifier_group_id) values
  (md5('item:smash-burger')::uuid,      md5('mg:burger')::uuid),
  (md5('item:hot-honey-chicken')::uuid, md5('mg:burger')::uuid),
  (md5('item:green-bowl')::uuid,        md5('mg:bowl')::uuid),
  (md5('item:chicken-wrap')::uuid,      md5('mg:bowl')::uuid),
  (md5('item:sparkling-lime')::uuid,    md5('mg:drink')::uuid),
  (md5('item:iced-coffee')::uuid,       md5('mg:drink')::uuid)
on conflict (menu_item_id, modifier_group_id) do nothing;

commit;
