
CREATE OR REPLACE FUNCTION public.get_attendance_with_details(
  p_class_id uuid DEFAULT NULL,
  p_subject_id uuid DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_limit integer DEFAULT 5000
)
 RETURNS TABLE(id uuid, student_id uuid, class_id uuid, subject_id uuid, date date, is_present boolean, justification text, daily_activity text, created_at timestamp with time zone, updated_at timestamp with time zone, student_name text, student_enrollment text, student_number text, student_status text, class_name text, subject_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    (
      get_user_role(auth.uid()) IN ('admin', 'secretary', 'tutor')
      OR
      (
        get_user_role(auth.uid()) = 'instructor'
        AND instructor_can_access_subject(auth.uid(), a.subject_id)
      )
      OR
      (
        get_user_role(auth.uid()) = 'student'
        AND a.student_id = auth.uid()
      )
    )
    AND (p_class_id IS NULL OR a.class_id = p_class_id)
    AND (p_subject_id IS NULL OR a.subject_id = p_subject_id)
    AND (p_start_date IS NULL OR a.date >= p_start_date)
    AND (p_end_date IS NULL OR a.date <= p_end_date)
  ORDER BY a.date DESC, a.created_at DESC
  LIMIT p_limit;
$function$;
