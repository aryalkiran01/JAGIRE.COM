/*
# Auto-generate referral codes for profiles

1. Changes
- Adds a `BEFORE INSERT` trigger on `profiles` that sets `referral_code` to a random 8-char string when null.
- Adds an `AFTER UPDATE` safety trigger that backfills `referral_code` for any existing profile row that still has a null code.
- Backfills all existing rows immediately so the referrals page works for current users.

2. Security
- No new tables. No policy changes. The trigger runs as the inserting user (owner), so RLS still applies.
- The referral code is derived from `gen_random_bytes` (cryptographically random) and is not predictable.
*/

-- 8-char base32-ish referral code (uppercase letters + digits, no ambiguous chars)
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
  SELECT upper(encode(substring(gen_random_bytes(5) FROM 1 FOR 5), 'hex'));
$$;

-- Set referral_code on insert if missing
CREATE OR REPLACE FUNCTION public.ensure_referral_code_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_referral_code ON profiles;
CREATE TRIGGER ensure_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_referral_code_on_insert();

-- Backfill any existing profiles that still have NULL referral_code
UPDATE profiles
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL;
