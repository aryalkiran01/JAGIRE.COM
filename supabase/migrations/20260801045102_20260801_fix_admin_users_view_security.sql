/*
# Fix admin_users view — SECURITY DEFINER bypasses RLS

## Purpose
The `admin_users` view was created with SECURITY DEFINER (default), meaning it runs
with the owner's privileges and bypasses RLS on the underlying `profiles` table.
Any authenticated user who can SELECT from this view sees ALL profiles, including
private data they shouldn't access.

## Fix
Recreate the view with `security_invoker = true` so it runs with the caller's
privileges and respects RLS on `profiles`.

## Notes
1. The view joins `profiles` with `user_roles` — both must respect the caller's RLS.
2. On Postgres 15+, `security_invoker = true` is the correct fix.
*/

DROP VIEW IF EXISTS admin_users CASCADE;

CREATE VIEW admin_users WITH (security_invoker = true) AS
SELECT
  p.*,
  ur.role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id;

GRANT SELECT ON admin_users TO authenticated;
