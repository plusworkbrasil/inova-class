-- Create RPC function to get attendance with joined details, bypassing RLS for joins
CREATE OR REPLACE FUNCTION public.get_attendance_with_details()
RETURNS TABLE(
  id uuid,
  student_id uuid,
  class_id uuid,
  subject_id uuid,
  date date,
  is_present boolean,
  justification text,
  daily_activity text,
  created_at timestamptz,
  updated_at timestamptz,
  student_name text,
  student_enrollment text,
  student_number text,
  student_status text,
  class_name text,
  subject_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    a.id,
    a.student_id,
    a.class_id,
    a.subject_id,
    a.date,
    a.is_present,
    a.justification,
    a.daily_activity,
    a.created_at,
    a.updated_at,
    p.name as student_name,
    p.enrollment_number as student_enrollment,
    p.student_id as student_number,
    p.status as student_status,
    c.name as class_name,
    s.name as subject_name
  FROM attendance a
  LEFT JOIN profiles p ON p.id = a.student_id
  LEFT JOIN classes c ON c.id = a.class_id
  LEFT JOIN subjects s ON s.id = a.subject_id
  WHERE 
    -- Admins, secretários e tutores veem tudo
    get_user_role(auth.uid()) IN ('admin', 'secretary', 'tutor')
    OR
    -- Instrutores veem attendance dos seus subjects
    (
      get_user_role(auth.uid()) = 'instructor'
      AND instructor_can_access_subject(auth.uid(), a.subject_id)
    )
    OR
    -- Alunos veem apenas seus próprios registros
    (
      get_user_role(auth.uid()) = 'student'
      AND a.student_id = auth.uid()
    )
  ORDER BY a.date DESC, a.created_at DESC;
$$;

COMMENT ON FUNCTION public.get_attendance_with_details IS 
'Returns attendance records with joined student, class, and subject names. Uses SECURITY DEFINER to bypass RLS on joins while maintaining authorization in WHERE clause.';