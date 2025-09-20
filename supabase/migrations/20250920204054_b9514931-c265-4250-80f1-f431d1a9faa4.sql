-- Corrigir a função create-user para aceitar role 'teacher'
-- Atualizar as validações de role para incluir 'teacher'

-- Primeiro, vamos adicionar 'teacher' como um valor válido do enum app_role se não existir
DO $$
BEGIN
    -- Verificar se o tipo 'teacher' já existe no enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'teacher' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
    ) THEN
        ALTER TYPE app_role ADD VALUE 'teacher';
    END IF;
END $$;

-- Atualizar a função handle_new_user para aceitar 'teacher' como role válido
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'name', new.email),
    new.email,
    COALESCE((new.raw_user_meta_data ->> 'role')::app_role, 'student')
  );
  RETURN new;
END;
$function$;