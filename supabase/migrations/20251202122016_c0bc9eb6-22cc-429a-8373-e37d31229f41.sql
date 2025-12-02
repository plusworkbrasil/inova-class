-- Criar política RLS específica para UPDATE de instrutores
-- Instrutores só podem editar notas que eles mesmos lançaram (baseado em teacher_id)

CREATE POLICY "Instructors can update their own grades" 
ON grades FOR UPDATE 
USING (
  get_user_role(auth.uid()) = 'instructor'::app_role 
  AND teacher_id = auth.uid()
)
WITH CHECK (
  get_user_role(auth.uid()) = 'instructor'::app_role 
  AND teacher_id = auth.uid()
);