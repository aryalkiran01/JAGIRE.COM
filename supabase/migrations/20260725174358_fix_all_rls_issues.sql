-- ==========================================
-- Fix has_role compatibility
-- ==========================================

CREATE OR REPLACE FUNCTION public.has_role(
  _user_id UUID,
  _role public.app_role
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  );
$$;


GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role)
TO authenticated, anon;


-- ==========================================
-- Remove duplicate contact policies
-- ==========================================

DROP POLICY IF EXISTS "admin_select_contact" 
ON public.contact_messages;

DROP POLICY IF EXISTS "admin_delete_contact" 
ON public.contact_messages;

DROP POLICY IF EXISTS "anon_insert_contact" 
ON public.contact_messages;


DROP POLICY IF EXISTS "admin_select_contact_messages"
ON public.contact_messages;

DROP POLICY IF EXISTS "anon_insert_contact_messages"
ON public.contact_messages;


-- ==========================================
-- Recreate contact policies cleanly
-- ==========================================

CREATE POLICY "anon_insert_contact_messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);


CREATE POLICY "admin_select_contact_messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
);


CREATE POLICY "admin_delete_contact_messages"
ON public.contact_messages
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
);



-- ==========================================
-- Fix AI duplicate policies
-- ==========================================

DROP POLICY IF EXISTS "select_own_conversations"
ON public.ai_conversations;

DROP POLICY IF EXISTS "insert_own_conversations"
ON public.ai_conversations;

DROP POLICY IF EXISTS "update_own_conversations"
ON public.ai_conversations;

DROP POLICY IF EXISTS "delete_own_conversations"
ON public.ai_conversations;


-- ==========================================
-- Remove broken duplicate migration artifacts
-- ==========================================

DROP POLICY IF EXISTS "admin_select_contact"
ON public.contact_messages;
