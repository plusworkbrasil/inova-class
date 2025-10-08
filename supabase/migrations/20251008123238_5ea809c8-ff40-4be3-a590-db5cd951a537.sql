-- Fix get_instructor_subjects function to not reference profiles.role
CREATE OR REPLACE FUNCTION public.get_instructor_subjects(instructor_id uuid)
 RETURNS TABLE(id uuid, name text, class_id uuid, class_name text, teacher_id uuid, student_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    s.id,
    s.name,
    s.class_id,
    c.name as class_name,
    s.teacher_id,
    COUNT(DISTINCT p.id) as student_count
  FROM subjects s
  LEFT JOIN classes c ON c.id = s.class_id
  LEFT JOIN profiles p ON p.class_id = s.class_id AND get_user_role(p.id) = 'student'
  WHERE s.teacher_id = instructor_id 
     OR s.name IN (
       SELECT unnest(instructor_subjects) 
       FROM profiles 
       WHERE id = instructor_id
     )
  GROUP BY s.id, s.name, s.class_id, c.name, s.teacher_id;
$function$;

-- Fix instructor_can_access_subject function to not reference profiles.role
CREATE OR REPLACE FUNCTION public.instructor_can_access_subject(instructor_id uuid, subject_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM subjects s
    WHERE s.id = subject_id
      AND get_user_role(instructor_id) = 'instructor'
      AND (
        s.teacher_id = instructor_id 
        OR s.name = ANY(
          SELECT unnest(instructor_subjects) 
          FROM profiles 
          WHERE id = instructor_id
        )
      )
  );
$function$;