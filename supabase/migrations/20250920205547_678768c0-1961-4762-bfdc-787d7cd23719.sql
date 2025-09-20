-- Criar todas as tabelas baseadas nos formulários do sistema

-- Tabela de equipamentos (não vi formulário específico mas vou criar baseado nos padrões)
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  warranty_date DATE,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'disponivel',
  observations TEXT,
  responsible_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para equipamentos
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Políticas para equipamentos
CREATE POLICY "Admins and secretaries can manage all equipment" 
ON public.equipment 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'secretary'::app_role]));

CREATE POLICY "Instructors can view equipment" 
ON public.equipment 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'instructor'::app_role);

-- Tabela de avisos/comunicações expandida (já existe communications, mas vou garantir que está completa)
-- A tabela communications já existe, mas vou adicionar campos que podem estar faltando
DO $$
BEGIN
  -- Verificar se a coluna read_by existe, se não, criar
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communications' AND column_name='read_by') THEN
    ALTER TABLE public.communications ADD COLUMN read_by UUID[];
  END IF;
  
  -- Verificar se a coluna category existe, se não, criar
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communications' AND column_name='category') THEN
    ALTER TABLE public.communications ADD COLUMN category TEXT DEFAULT 'geral';
  END IF;
END $$;

-- Trigger para update_at nas tabelas
CREATE TRIGGER update_equipment_updated_at
BEFORE UPDATE ON public.equipment
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON public.equipment(type);
CREATE INDEX IF NOT EXISTS idx_equipment_responsible ON public.equipment(responsible_id);

-- Atualizar a tabela profiles para incluir todos os campos dos formulários
DO $$
BEGIN
  -- Campos do StudentForm que podem estar faltando
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='enrollment_number') THEN
    ALTER TABLE public.profiles ADD COLUMN enrollment_number TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='parent_phone') THEN
    ALTER TABLE public.profiles ADD COLUMN parent_phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='emergency_contact') THEN
    ALTER TABLE public.profiles ADD COLUMN emergency_contact TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='medical_info') THEN
    ALTER TABLE public.profiles ADD COLUMN medical_info TEXT;
  END IF;
END $$;

-- Atualizar a tabela subjects para incluir campos do SubjectForm
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='code') THEN
    ALTER TABLE public.subjects ADD COLUMN code TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='workload') THEN
    ALTER TABLE public.subjects ADD COLUMN workload INTEGER DEFAULT 40;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='description') THEN
    ALTER TABLE public.subjects ADD COLUMN description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='status') THEN
    ALTER TABLE public.subjects ADD COLUMN status TEXT DEFAULT 'ativo';
  END IF;
END $$;

-- Garantir que grades tenha o campo observations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='grades' AND column_name='observations') THEN
    ALTER TABLE public.grades ADD COLUMN observations TEXT;
  END IF;
END $$;

-- Garantir que attendance tenha todos os campos necessários
-- A tabela attendance já existe e parece estar completa

-- Garantir que evasions tenha todos os campos necessários  
-- A tabela evasions já existe e parece estar completa

-- Garantir que declarations tenha todos os campos necessários
-- A tabela declarations já existe e parece estar completa