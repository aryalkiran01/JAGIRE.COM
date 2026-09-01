-- Fix: REVOKE EXECUTE FROM PUBLIC (not just anon) for 3 SECURITY DEFINER functions
-- The default EXECUTE privilege is granted to PUBLIC, so REVOKE FROM anon alone had no effect.

REVOKE EXECUTE ON FUNCTION public.is_premium() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_admins_contact_message() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_ticket_owner_reply() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_premium() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_admins_contact_message() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_ticket_owner_reply() TO authenticated;
