-- Adicionar políticas RLS para permitir admins e secretários gerenciarem roles

-- Política para DELETE: Admins e secretários podem deletar roles de qualquer usuário
CREATE POLICY "Admins and secretaries can delete any user role"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'secretary')
);

-- Política para INSERT: Admins e secretários podem inserir roles para qualquer usuário
CREATE POLICY "Admins and secretaries can insert any user role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'secretary')
);

-- Política para UPDATE: Admins e secretários podem atualizar roles de qualquer usuário
CREATE POLICY "Admins and secretaries can update any user role"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'secretary')
)
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'secretary')
);