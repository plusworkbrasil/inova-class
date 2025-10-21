-- Atribuir role de instrutor para jlsilva91@hotmail.com
INSERT INTO public.user_roles (user_id, role, granted_by)
VALUES (
  '3886fab0-5317-43dc-bdaf-d0c0b2b41501',
  'instructor'::app_role,
  auth.uid()
)
ON CONFLICT (user_id, role) DO NOTHING;