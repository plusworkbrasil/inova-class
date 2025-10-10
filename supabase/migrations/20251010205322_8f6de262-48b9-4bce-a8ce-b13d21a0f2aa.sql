-- Remover policy antiga que permite apenas admin
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Criar nova policy permitindo admin e secretary gerenciar roles
CREATE POLICY "Admins and secretaries can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'secretary')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'secretary')
);