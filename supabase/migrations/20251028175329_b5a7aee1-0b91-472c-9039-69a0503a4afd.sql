-- Atribuir role 'student' aos usuários sem role
INSERT INTO public.user_roles (user_id, role, granted_at)
VALUES 
  ('6228d083-fe9b-4bec-9439-8db98bd8734e', 'student', now()), -- jejejesicamaria@gmail.com
  ('d08eb231-e953-4492-99d7-e98a34ccb863', 'student', now()), -- annelais002@gmail.com
  ('e45cf820-1465-4f76-8fea-db9d84ea9fad', 'student', now())  -- beatrizsouza85596@gmail.com
ON CONFLICT (user_id, role) DO NOTHING;