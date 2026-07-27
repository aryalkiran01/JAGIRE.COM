/* Admin subscription management — RLS policies for admin role */

-- Admin SELECT: admins can read all subscriptions
DROP POLICY IF EXISTS "admin_select_subscriptions" ON subscriptions;

CREATE POLICY "admin_select_subscriptions"
ON subscriptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
   AND user_roles.role = 'admin'::app_role
  )
);


-- Admin UPDATE: admins can update any subscription
DROP POLICY IF EXISTS "admin_update_subscriptions" ON subscriptions;

CREATE POLICY "admin_update_subscriptions"
ON subscriptions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);


-- Indexes for admin listing
CREATE INDEX IF NOT EXISTS subscriptions_status_idx
ON subscriptions (status);

CREATE INDEX IF NOT EXISTS subscriptions_expires_at_idx
ON subscriptions (expires_at);