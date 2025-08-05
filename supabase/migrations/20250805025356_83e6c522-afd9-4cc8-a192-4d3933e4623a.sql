-- Atualizar políticas RLS para permitir acesso de Coordenadores e Tutores aos dados dos alunos

-- 1. Atualizar política de visualização de declarações para incluir coordinator e tutor
DROP POLICY IF EXISTS "Secretaries can view all declarations" ON public.declarations;
CREATE POLICY "Admins, secretaries, coordinators and tutors can view all declarations" 
ON public.declarations 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'secretary'::app_role, 'coordinator'::app_role, 'tutor'::app_role]));

-- 2. Atualizar política de atualização de declarações para incluir coordinator e tutor
DROP POLICY IF EXISTS "Secretaries can update declarations" ON public.declarations;
CREATE POLICY "Admins, secretaries, coordinators and tutors can update declarations" 
ON public.declarations 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'secretary'::app_role, 'coordinator'::app_role, 'tutor'::app_role]));

-- 3. Atualizar política de visualização de perfis para incluir coordinator e tutor
DROP POLICY IF EXISTS "Admins and secretaries can view all profiles" ON public.profiles;
CREATE POLICY "Admins, secretaries, coordinators and tutors can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'secretary'::app_role, 'coordinator'::app_role, 'tutor'::app_role]));

-- 4. Criar política para permitir que coordinators e tutors possam atualizar informações dos alunos se necessário
CREATE POLICY "Coordinators and tutors can update student profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['coordinator'::app_role, 'tutor'::app_role]) 
  AND role = 'student'::app_role
);