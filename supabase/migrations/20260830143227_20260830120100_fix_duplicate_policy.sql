-- Fix: drop the conflicting policy that was already present, then recreate with correct definition
DROP POLICY IF EXISTS "admin_update_user_roles" ON public.user_roles;

CREATE POLICY "admin_update_user_roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));