-- Adicionar campo data de nascimento na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Criar índice para melhor performance em consultas por idade
CREATE INDEX IF NOT EXISTS idx_profiles_birth_date ON public.profiles(birth_date);