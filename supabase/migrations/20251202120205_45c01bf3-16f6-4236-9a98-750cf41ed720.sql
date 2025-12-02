-- Permitir instrutores excluir notas que eles mesmos criaram
DROP POLICY IF EXISTS "Only admins and secretaries can delete grades" ON grades;

CREATE POLICY "Admins, secretaries and instructors can delete their own grades" 
ON grades FOR DELETE 
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'secretary'::app_role])
  OR (
    get_user_role(auth.uid()) = 'instructor'::app_role 
    AND teacher_id = auth.uid()
  )
);