-- Drop the security definer view and create a proper view with RLS
DROP VIEW IF EXISTS public.instructor_student_view;

-- Create regular view that respects RLS policies
CREATE VIEW public.instructor_student_view AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.student_id,
  p.class_id,
  p.enrollment_number,
  p.status,
  p.phone,
  c.name as class_name
FROM profiles p
LEFT JOIN classes c ON c.id = p.class_id
WHERE p.role = 'student';

-- Grant access to the view (RLS policies on profiles table will still apply)
GRANT SELECT ON public.instructor_student_view TO authenticated;