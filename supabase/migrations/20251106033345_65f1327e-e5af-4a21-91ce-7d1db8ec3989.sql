-- Drop the old function signature first
DROP FUNCTION IF EXISTS public.get_instructor_class_students(uuid, uuid);

-- Create the updated function with attendance_date parameter
CREATE OR REPLACE FUNCTION public.get_instructor_class_students(
  instructor_id uuid,
  target_class_id uuid,
  attendance_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  id uuid,
  name text,
  student_id text,
  enrollment_number text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT
    p.id,
    p.name,
    p.student_id,
    p.enrollment_number
  FROM profiles p
  WHERE p.class_id = target_class_id
    AND p.status = 'active'
    AND get_user_role(p.id) = 'student'
    -- Exclude students if evasion occurred BEFORE or ON the attendance date
    AND NOT EXISTS (
      SELECT 1
      FROM evasions e
      WHERE e.student_id = p.id
        AND e.status = 'active'
        AND e.date <= attendance_date
    )
    AND EXISTS (
      -- Verify instructor has a subject in this class
      SELECT 1 
      FROM subjects s
      WHERE s.class_id = target_class_id
        AND (
          s.teacher_id = instructor_id
          OR s.name = ANY(
            SELECT unnest(instructor_subjects)
            FROM profiles
            WHERE id = instructor_id
          )
        )
    )
  ORDER BY p.name ASC;
$$;

COMMENT ON FUNCTION public.get_instructor_class_students IS 
'Returns students from a class that the instructor has permission to view (based on assigned subjects). Excludes students with active evasion on or before the attendance date.';
