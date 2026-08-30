/*
# Fix Payment RLS — prevent self-activation of subscriptions

The subscriptions table allowed any user to INSERT/UPDATE their own row
with arbitrary plan_type, status="active", payment_status="paid".
This means a user could activate any plan without paying.

Now only the service role (edge function) can insert/update subscriptions.
Users can still SELECT their own subscription (read-only).
*/

-- Remove self-insert and self-update on subscriptions
DROP POLICY IF EXISTS "insert_own_subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "update_own_subscriptions" ON public.subscriptions;

-- Keep: select_own_subscriptions (read), admin_select_subscriptions, admin_update_subscriptions, delete_own_subscriptions

-- Also lock down payments: remove self-insert (was used by client-side code)
-- The edge function uses service role (bypasses RLS) to insert payments
DROP POLICY IF EXISTS "insert_own_payment" ON public.payments;
DROP POLICY IF EXISTS "update_own_payment" ON public.payments;

-- Keep: select_own_payments (read-only)

-- Ensure RLS is enabled
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;