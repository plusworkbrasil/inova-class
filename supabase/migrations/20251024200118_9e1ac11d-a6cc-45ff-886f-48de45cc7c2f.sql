-- Alterar email de fred@inovase.org para fredgentil@gmail.com e confirmar
UPDATE auth.users
SET email = 'fredgentil@gmail.com',
    email_confirmed_at = now(),
    raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{email}',
      '"fredgentil@gmail.com"'::jsonb
    )
WHERE id = '69da9933-ba06-449f-877d-36f5f7ba6826';

-- Atualizar email na tabela profiles para manter consistência
UPDATE public.profiles
SET email = 'fredgentil@gmail.com'
WHERE id = '69da9933-ba06-449f-877d-36f5f7ba6826';