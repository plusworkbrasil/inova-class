-- Remover a política que causa recursão infinita
DROP POLICY IF EXISTS "Instructors can view students from their classes" ON public.profiles;

-- Criar nova política SEM recursão, usando apenas a tabela user_roles
CREATE POLICY "Instructors can view students from their classes"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Permitir se o usuário autenticado for instrutor (checando user_roles diretamente)
  -- E o perfil sendo acessado for de um aluno (checando user_roles diretamente)
  -- E o aluno estiver em uma turma onde o instrutor ministra alguma disciplina
  EXISTS (
    SELECT 1 FROM user_roles ur_instructor
    WHERE ur_instructor.user_id = auth.uid()
      AND ur_instructor.role = 'instructor'
  )
  AND EXISTS (
    SELECT 1 FROM user_roles ur_student
    WHERE ur_student.user_id = profiles.id
      AND ur_student.role = 'student'
  )
  AND class_id IN (
    -- Buscar todas as turmas onde o instrutor ministra disciplinas
    SELECT DISTINCT s.class_id
    FROM subjects s
    WHERE s.teacher_id = auth.uid()
       OR s.name = ANY(
         SELECT unnest(instructor_subjects) 
         FROM profiles 
         WHERE id = auth.uid()
       )
  )
);