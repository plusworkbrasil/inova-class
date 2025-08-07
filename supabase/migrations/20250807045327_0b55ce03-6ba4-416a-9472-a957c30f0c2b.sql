-- Allow admins and secretaries to insert new profiles
CREATE POLICY "Admins and secretaries can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (get_user_role(auth.uid()) = ANY(ARRAY['admin'::app_role, 'secretary'::app_role]));