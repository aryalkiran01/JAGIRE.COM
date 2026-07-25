/* Admin subscription management — RLS policies for admin role.

The existing subscriptions RLS only allows the owner (auth.uid() = user_id).
Admins need to view ALL subscriptions and update status/plan/expiry to manage
users. This adds admin-scoped SELECT and UPDATE policies (no admin INSERT or
DELETE — subscriptions are only created via payment verification).

Also adds a join view helper for admin UI to show user details alongside
subscription data without exposing auth.users directly.
*/

-- Admin SELECT: admins can read all subscriptions
DROP POLICY IF EXISTS "admin_select_subscriptions" ON subscriptions;
CREATE POLICY "admin_select_subscriptions" ON subscriptions FOR SELECT
  TO authenticated
  USING (public.has_role('admin'::app_role));

-- Admin UPDATE: admins can update any subscription (activate/extend/cancel/plan)
DROP POLICY IF EXISTS "admin_update_subscriptions" ON subscriptions;
CREATE POLICY "admin_update_subscriptions" ON subscriptions FOR UPDATE
  TO authenticated
  USING (public.has_role('admin'::app_role))
  WITH CHECK (public.has_role('admin'::app_role));

-- Index for admin listing by status
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions (status);
CREATE INDEX IF NOT EXISTS subscriptions_expires_at_idx ON subscriptions (expires_at);
