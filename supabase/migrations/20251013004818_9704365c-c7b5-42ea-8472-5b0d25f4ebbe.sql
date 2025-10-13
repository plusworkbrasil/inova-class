-- Fix attendance RLS policy to handle NULL instructor_subjects
DROP POLICY IF EXISTS "Instructors can manage attendance for their subjects" ON public.attendance;

CREATE POLICY "Instructors can manage attendance for their subjects" 
ON public.attendance
FOR ALL 
USING (
  get_user_role(auth.uid()) = 'instructor'::app_role 
  AND subject_id IN (
    SELECT s.id 
    FROM public.subjects s 
    WHERE s.teacher_id = auth.uid()
       OR (
         s.name = ANY(
           COALESCE(
             (SELECT instructor_subjects FROM public.profiles WHERE id = auth.uid()),
             ARRAY[]::text[]
           )
         )
       )
  )
);

-- Initialize empty array for instructors with NULL instructor_subjects
UPDATE public.profiles
SET instructor_subjects = ARRAY[]::text[]
WHERE id IN (
  SELECT user_id FROM user_roles WHERE role = 'instructor'
)
AND instructor_subjects IS NULL;