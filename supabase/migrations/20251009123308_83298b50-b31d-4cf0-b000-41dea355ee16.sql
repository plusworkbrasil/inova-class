-- Atualizar a função handle_new_user para não inserir role
-- O role agora é gerenciado pela tabela user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Inserir apenas dados básicos no perfil
  -- O role será gerenciado pela tabela user_roles
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'name', new.email),
    new.email
  );
  RETURN new;
END;
$$;