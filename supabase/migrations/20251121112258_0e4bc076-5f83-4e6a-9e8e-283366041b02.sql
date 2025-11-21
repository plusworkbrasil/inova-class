-- ================================================
-- Migration: Add foreign key constraint for profiles.class_id
-- Data: 2025-11-21
-- Objetivo: Estabelecer relação formal entre profiles e classes
-- ================================================

-- Adicionar constraint de foreign key
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_class_id_fkey 
FOREIGN KEY (class_id) 
REFERENCES public.classes(id) 
ON DELETE SET NULL;

-- Adicionar índice para melhorar performance das queries com JOIN
CREATE INDEX IF NOT EXISTS idx_profiles_class_id 
ON public.profiles(class_id) 
WHERE class_id IS NOT NULL;

-- Comentário explicativo
COMMENT ON CONSTRAINT profiles_class_id_fkey ON public.profiles IS 
'Foreign key constraint linking profiles to classes. ON DELETE SET NULL ensures profiles are not deleted when a class is removed.';