-- ==============================================================================
-- Fix Payment Plan Constraints & Subscription Read Policy
-- Ensures subscriptions and payments accept all current plan types ('premium', 'starter', 'professional', 'enterprise', 'pro')
-- ==============================================================================

-- 1. Ensure subscriptions table plan_type constraint includes all standard plans
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_type_check
  CHECK (plan_type IN ('premium', 'starter', 'professional', 'enterprise', 'pro', 'free'));

-- 2. Ensure payments table plan_type constraint supports standard plan types
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_plan_type_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_plan_type_check
  CHECK (plan_type IS NULL OR plan_type IN ('premium', 'starter', 'professional', 'enterprise', 'pro', 'free', 'premium_seeker', 'featured_job', 'employer_premium'));

-- 3. Ensure unique index on subscriptions.user_id for reliable single-row upsert
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_unique_idx ON public.subscriptions (user_id);

-- 4. Ensure RLS is enabled and authenticated users can select their own subscription
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subscriptions" ON public.subscriptions;
CREATE POLICY "select_own_subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Grant explicit SELECT on subscriptions and payments to authenticated users
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
