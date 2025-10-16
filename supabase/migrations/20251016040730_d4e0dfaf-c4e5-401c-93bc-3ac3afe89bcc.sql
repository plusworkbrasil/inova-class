-- Dropar políticas que causam recursão infinita
DROP POLICY IF EXISTS "Admins and secretaries can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Instructors can view students in their classes" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile deletion" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile updates" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile creation" ON public.profiles;

-- Política 1: Admins e secretárias veem todos os perfis
-- NOVO: Consulta user_roles diretamente, SEM get_user_role()
CREATE POLICY "Admins and secretaries can view all profiles v2"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'secretary')
  )
);

-- Política 2: Instrutores veem perfis de alunos nas suas turmas
-- NOVO: Também consulta user_roles diretamente
CREATE POLICY "Instructors can view their class students"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'instructor'
  )
  AND EXISTS (
    SELECT 1 FROM subjects s
    WHERE s.class_id = profiles.class_id
      AND s.teacher_id = auth.uid()
  )
);

-- Política 3: Admins podem deletar perfis
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

-- Política 4: Usuários atualizam próprio perfil, admins/secretárias atualizam qualquer um
CREATE POLICY "Users and admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'secretary')
  )
)
WITH CHECK (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'secretary')
  )
);

-- Política 5: Apenas admins e secretárias podem criar perfis
CREATE POLICY "Admins and secretaries can create profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'secretary')
  )
);