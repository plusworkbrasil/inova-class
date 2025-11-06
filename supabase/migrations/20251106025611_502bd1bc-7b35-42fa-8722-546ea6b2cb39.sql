-- Função segura para instrutores buscarem alunos de uma turma
-- Só retorna alunos de turmas onde o instrutor tem subjects atribuídos
CREATE OR REPLACE FUNCTION public.get_instructor_class_students(
  instructor_id uuid,
  target_class_id uuid
)
RETURNS TABLE(
  id uuid,
  name text,
  student_id text,
  enrollment_number text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT
    p.id,
    p.name,
    p.student_id,
    p.enrollment_number
  FROM profiles p
  WHERE p.class_id = target_class_id
    AND p.status = 'active'
    AND get_user_role(p.id) = 'student'
    AND EXISTS (
      -- Verifica se o instrutor tem algum subject nesta turma
      SELECT 1 
      FROM subjects s
      WHERE s.class_id = target_class_id
        AND (
          s.teacher_id = instructor_id
          OR s.name = ANY(
            SELECT unnest(instructor_subjects)
            FROM profiles
            WHERE id = instructor_id
          )
        )
    )
  ORDER BY p.name ASC;
$$;

COMMENT ON FUNCTION public.get_instructor_class_students IS 
'Retorna alunos de uma turma que o instrutor tem permissão para visualizar (baseado em subjects atribuídos)';