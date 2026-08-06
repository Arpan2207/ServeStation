# Supabase Auth and RLS Setup

Use this after Steps 1–7 are complete. Never put the database password or
`service_role` key in the app.

## 1. Run the migration

In Supabase SQL Editor, run all of
`supabase/migrations/0004_auth_and_rls.sql`. This creates `staff_profiles`, the
`owner`/`manager`/`cashier` roles, protected order RPCs, and store-scoped RLS.

After this migration, anonymous catalog and order access is intentionally
blocked. The app must have a valid staff session.

## 2. Create the first staff account

1. Open **Authentication → Users → Add user** in Supabase Dashboard.
2. Create an email/password user and mark the email confirmed.
3. Copy the new user's UUID.
4. Run this in SQL Editor, replacing the placeholder UUID:

```sql
insert into public.staff_profiles (
  user_id,
  store_id,
  display_name,
  role
) values (
  'YOUR_AUTH_USER_UUID',
  md5('store:servestation-main')::uuid,
  'Your Name',
  'owner'
);
```

Create staff accounts through the Dashboard (or a future trusted server), not
through public app sign-up. Assign authorization in `staff_profiles`, never in
user-editable Auth metadata.

## 3. Test with the app

1. Restart Metro with `npm run dev:clear`.
2. Confirm the app opens the staff sign-in screen.
3. Sign in with the normal staff account—not a service key.
4. Confirm the seeded catalog loads.
5. Use **Save** and **Charge**; verify new orders contain the Auth user UUID in
   `orders.staff_id`.
6. Confirm Open/Closed order reads, **Mark as paid**, and **Cancel order** work.
7. Open Profile settings, confirm the staff name/role/store, then test Sign out.

## 4. Verify isolation

Create a second store and a second Auth user/profile assigned to that store.
When signed in as the second user, the first store's catalog and orders must
not appear. In the Supabase API or app, unauthenticated reads should return no
rows, and direct table inserts/updates should be denied. Only `create_order`
and `apply_order_status_transition` should perform order writes.
