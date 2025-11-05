-- Adicionar política RLS para permitir que admins e secretaries vejam todos os roles de usuários
CREATE POLICY "Admins and secretaries can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'secretary')
);