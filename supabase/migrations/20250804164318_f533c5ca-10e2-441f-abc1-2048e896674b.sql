-- Inserir o perfil do administrador geral
-- Nota: O usuário precisa se cadastrar primeiro com este email através da interface de auth
-- Esta migração criará o perfil admin para quando o usuário se cadastrar

INSERT INTO public.profiles (
  id,
  name,
  email,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Administrador Geral',
  'pluswork.com.br@gmail.com',
  'admin',
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  name = 'Administrador Geral',
  updated_at = now();