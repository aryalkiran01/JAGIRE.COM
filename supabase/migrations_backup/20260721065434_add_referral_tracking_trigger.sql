/*
# Add referral tracking on signup

1. Purpose
   When a new user signs up with a `referral_code` in their raw_user_meta_data
   (passed from the signup form's `?ref=` query param), this trigger finds the
   referring user by that code and creates a record in the `referrals` table
   linking referrer -> new user. Marks the referral as "completed" and awards
   reward credits.

2. New Functions
   - `process_referral_on_signup()` — AFTER INSERT on auth.users, reads
     `raw_user_meta_data->>'referral_code'`, looks up the referrer in
     `profiles.referral_code`, and inserts into `referrals` if not already
     present (idempotent via unique constraint on referred_email or
     referred_user_id).

3. New Triggers
   - `on_auth_user_created_referral` — AFTER INSERT on auth.users, calls
     `process_referral_on_signup()` for each new row.

4. Security
   - No new tables. No RLS changes. The function runs as SECURITY DEFINER
     (definer is the migration owner, typically postgres) so it can read
     `auth.users` metadata and insert into `public.referrals` / `public.profiles`
     without being blocked by RLS.

5. Notes
   - Idempotent: if a referral row already exists for this new user's email or
     user_id, it does nothing (guarded by NOT EXISTS check).
   - Does NOT award credits to the referrer's profile directly — that can be
     a separate step. The `referrals.reward_credits` column records the award.
   - Default reward: 100 credits (configurable later).
*/

CREATE OR REPLACE FUNCTION public.process_referral_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_referrer_id uuid;
  v_reward int := 100;
BEGIN
  v_code := NEW.raw_user_meta_data->>'referral_code';
  IF v_code IS NULL OR v_code = '' THEN
    RETURN NEW;
  END IF;

  -- Find the referrer by their referral_code
  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = v_code
  LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RETURN NEW; -- invalid code, silently ignore
  END IF;

  -- Don't self-refer
  IF v_referrer_id = NEW.id THEN
    RETURN NEW;
  END IF;

  -- Insert referral record if not already present
  IF NOT EXISTS (
    SELECT 1 FROM public.referrals
    WHERE referrer_id = v_referrer_id
      AND (referred_user_id = NEW.id OR referred_email = NEW.email)
  ) THEN
    INSERT INTO public.referrals
      (referrer_id, referred_user_id, referred_email, code, status, reward_credits)
    VALUES
      (v_referrer_id, NEW.id, NEW.email, v_code, 'completed', v_reward);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_referral ON auth.users;
CREATE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.process_referral_on_signup();
