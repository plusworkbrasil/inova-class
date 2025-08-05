-- Criar tabela para atribuição de computadores aos alunos

CREATE TABLE public.computer_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  computer_number TEXT NOT NULL CHECK (computer_number ~ '^[0-9]{3}$'),
  shift TEXT NOT NULL CHECK (shift IN ('morning', 'afternoon', 'evening')),
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint para garantir que um aluno só pode ter um computador por turno
  UNIQUE(student_id, shift, active) WHERE active = true,
  
  -- Constraint para garantir que um computador só pode estar ativo para um aluno por turno
  UNIQUE(computer_number, shift, active) WHERE active = true
);

-- Habilitar RLS
ALTER TABLE public.computer_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Instrutores podem visualizar todas as atribuições
CREATE POLICY "Instructors can view all computer assignments" 
ON public.computer_assignments 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'secretary'::app_role, 'coordinator'::app_role, 'tutor'::app_role, 'instructor'::app_role]));

-- Instrutores podem criar atribuições
CREATE POLICY "Instructors can create computer assignments" 
ON public.computer_assignments 
FOR INSERT 
WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'secretary'::app_role, 'coordinator'::app_role, 'tutor'::app_role, 'instructor'::app_role])
  AND assigned_by = auth.uid()
);

-- Instrutores podem atualizar atribuições
CREATE POLICY "Instructors can update computer assignments" 
ON public.computer_assignments 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'secretary'::app_role, 'coordinator'::app_role, 'tutor'::app_role, 'instructor'::app_role]));

-- Alunos podem visualizar suas próprias atribuições
CREATE POLICY "Students can view their own computer assignments" 
ON public.computer_assignments 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'student'::app_role 
  AND student_id = auth.uid()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_computer_assignments_updated_at
BEFORE UPDATE ON public.computer_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_computer_assignments_student_id ON public.computer_assignments(student_id);
CREATE INDEX idx_computer_assignments_computer_number ON public.computer_assignments(computer_number);
CREATE INDEX idx_computer_assignments_shift ON public.computer_assignments(shift);
CREATE INDEX idx_computer_assignments_active ON public.computer_assignments(active) WHERE active = true;