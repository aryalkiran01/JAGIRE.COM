-- Expand subscriptions.plan_type to support premium, starter, professional, enterprise
-- (previous constraint only allowed 'starter','pro','enterprise')
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_type_check
  CHECK (plan_type IN ('premium','starter','professional','enterprise','pro'));
