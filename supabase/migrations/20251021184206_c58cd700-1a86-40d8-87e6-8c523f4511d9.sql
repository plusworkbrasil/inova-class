-- Atribuir role de instrutor para fred@inovase.org
INSERT INTO public.user_roles (user_id, role, granted_by)
VALUES (
  '69da9933-ba06-449f-877d-36f5f7ba6826',
  'instructor'::app_role,
  auth.uid()
)
ON CONFLICT (user_id, role) DO NOTHING;