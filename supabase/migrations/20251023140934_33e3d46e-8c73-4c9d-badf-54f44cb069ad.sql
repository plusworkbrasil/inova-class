-- Adicionar política RLS para permitir instrutores criarem alocações de equipamentos
CREATE POLICY "Instructors can create allocations"
ON public.equipment_allocations
FOR INSERT
TO authenticated
WITH CHECK (
  -- Apenas instrutores podem criar alocações
  get_user_role(auth.uid()) = 'instructor'::app_role
  AND
  -- O allocated_by deve ser o próprio instrutor
  allocated_by = auth.uid()
);