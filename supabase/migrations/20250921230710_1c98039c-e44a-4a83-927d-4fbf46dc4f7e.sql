-- Criar sequência para identificação auto-incremento de alunos
CREATE SEQUENCE IF NOT EXISTS student_id_seq START 1001;

-- Adicionar coluna para ID auto-incremento de alunos
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS auto_student_id integer;

-- Função para gerar ID automático para novos alunos
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Só gera ID automático para estudantes
  IF NEW.role = 'student' AND NEW.auto_student_id IS NULL THEN
    NEW.auto_student_id = nextval('student_id_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar ID automático
DROP TRIGGER IF EXISTS set_auto_student_id ON profiles;
CREATE TRIGGER set_auto_student_id
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_student_id();

-- Atualizar alunos existentes que não têm ID automático
UPDATE profiles 
SET auto_student_id = nextval('student_id_seq') 
WHERE role = 'student' AND auto_student_id IS NULL;

-- Verificar e corrigir constraint de grades se necessário
DO $$
BEGIN
  -- Primeiro, vamos ver quais são os tipos válidos atualmente
  -- Se a constraint existir, vamos alterá-la para incluir os tipos que estamos usando
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'grades_type_check'
  ) THEN
    -- Remove a constraint antiga
    ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_type_check;
  END IF;
  
  -- Adiciona nova constraint com todos os tipos válidos
  ALTER TABLE grades 
  ADD CONSTRAINT grades_type_check 
  CHECK (type IN ('test', 'assignment', 'project', 'final', 'prova', 'trabalho', 'projeto', 'final_exam', 'avaliacao', 'exercicio'));
END $$;