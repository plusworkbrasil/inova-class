-- Atribuir role 'tutor' para Maria Rejane (mariarejaneconsultora@gmail.com)
INSERT INTO public.user_roles (user_id, role, granted_by)
VALUES (
  '96cfe70d-9b82-4bb1-8a68-13f7bb437806',
  'tutor',
  auth.uid()
)
ON CONFLICT (user_id, role) DO NOTHING;