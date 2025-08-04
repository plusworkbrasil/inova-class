-- Primeiro, adicionar constraint única no email se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_email_key'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
    END IF;
END $$;

-- Inserir o administrador geral se não existir
INSERT INTO public.profiles (
  id,
  name,
  email,
  role,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'Administrador Geral',
  'pluswork.com.br@gmail.com',
  'admin'::app_role,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = 'pluswork.com.br@gmail.com'
);