-- Atualizar o role do administrador geral para admin
UPDATE public.profiles 
SET role = 'admin'::app_role 
WHERE email = 'pluswork.com.br@gmail.com';