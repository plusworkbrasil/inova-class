-- Permitir instrutores verem alunos das turmas onde ministram disciplinas
CREATE POLICY "Instructors can view students from their classes"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Permitir se o usuário autenticado for instrutor
  -- E o perfil sendo acessado for de um aluno
  -- E o aluno estiver em uma turma onde o instrutor ministra alguma disciplina
  get_user_role(auth.uid()) = 'instructor'
  AND get_user_role(id) = 'student'
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