-- Corrigir função com search_path inseguro
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só gera ID automático para estudantes
  IF NEW.role = 'student' AND NEW.auto_student_id IS NULL THEN
    NEW.auto_student_id = nextval('student_id_seq');
  END IF;
  RETURN NEW;
END;
$$;