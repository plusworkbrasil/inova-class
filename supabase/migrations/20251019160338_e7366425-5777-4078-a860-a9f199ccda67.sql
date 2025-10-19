-- Corrigir políticas RLS de user_roles para eliminar recursão
-- Substituir has_role() por subconsulta direta

DROP POLICY IF EXISTS "Admins and secretaries can manage roles" ON public.user_roles;

CREATE POLICY "Admins and secretaries can manage roles v2"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = auth.uid()
      AND ur2.role IN ('admin', 'secretary')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = auth.uid()
      AND ur2.role IN ('admin', 'secretary')
  )
);

-- Dropar views problemáticas que podem causar erros de permissão
DROP VIEW IF EXISTS instructor_academic_info_view CASCADE;
DROP VIEW IF EXISTS instructor_student_view CASCADE;

-- Criar funções security definer em vez de views
CREATE OR REPLACE FUNCTION get_instructor_academic_info(instructor_id UUID)
RETURNS TABLE (
  id UUID,
  student_id UUID,
  class_id UUID,
  enrollment_date DATE,
  academic_status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sai.id,
    sai.student_id,
    sai.class_id,
    sai.enrollment_date,
    sai.academic_status,
    sai.created_at,
    sai.updated_at
  FROM student_academic_info sai
  JOIN profiles p ON p.id = sai.student_id
  WHERE EXISTS (
    SELECT 1 FROM subjects s
    WHERE s.class_id = sai.class_id
      AND s.teacher_id = instructor_id
  );
$$;