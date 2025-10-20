-- =====================================================
-- POLÍTICAS RLS PARA O ROLE TUTOR
-- =====================================================
-- Tutor pode visualizar e gerenciar dados acadêmicos
-- com permissões de leitura ampla e escrita limitada
-- =====================================================

-- 1. CLASSES - Tutor pode visualizar todas as turmas
CREATE POLICY "Tutors can view all classes"
ON classes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'tutor'
  )
);

-- 2. SUBJECTS - Tutor pode visualizar todas as disciplinas
CREATE POLICY "Tutors can view all subjects"
ON subjects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'tutor'
  )
);

-- 3. EVASIONS - Tutor pode visualizar todas as evasões
CREATE POLICY "Tutors can view all evasions"
ON evasions
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'tutor'
);

-- 4. EVASIONS - Tutor pode criar evasões
CREATE POLICY "Tutors can create evasions"
ON evasions
FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role(auth.uid()) = 'tutor'
  AND reported_by = auth.uid()
);

-- 5. EVASIONS - Tutor pode atualizar evasões que criou
CREATE POLICY "Tutors can update their own evasions"
ON evasions
FOR UPDATE
TO authenticated
USING (
  get_user_role(auth.uid()) = 'tutor'
  AND reported_by = auth.uid()
)
WITH CHECK (
  get_user_role(auth.uid()) = 'tutor'
  AND reported_by = auth.uid()
);

-- 6. PROFILES - Tutor pode visualizar todos os perfis (especialmente alunos)
CREATE POLICY "Tutors can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'tutor')
);

-- 7. ATTENDANCE - Tutor pode visualizar toda a frequência
CREATE POLICY "Tutors can view all attendance"
ON attendance
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'tutor'
);

-- 8. GRADES - Tutor pode visualizar todas as notas
CREATE POLICY "Tutors can view all grades"
ON grades
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'tutor'
);

-- 9. DECLARATIONS - Tutor pode visualizar todas as declarações
-- (já existe policy para students, agora adicionamos para tutor)
CREATE POLICY "Tutors can view all declarations"
ON declarations
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'tutor'
);