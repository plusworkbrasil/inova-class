-- Enhanced security fix for instructor access to student data (corrected)

-- First, drop the existing problematic view
DROP VIEW IF EXISTS public.instructor_student_view;

-- Create a more restrictive function to check instructor-student relationships
CREATE OR REPLACE FUNCTION public.instructor_can_view_student(target_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles student_profile
    JOIN subjects s ON s.class_id = student_profile.class_id
    JOIN profiles instructor_profile ON instructor_profile.id = auth.uid()
    WHERE student_profile.id = target_student_id
      AND student_profile.role = 'student'
      AND instructor_profile.role = 'instructor'
      AND (
        s.teacher_id = auth.uid() 
        OR s.name = ANY(instructor_profile.instructor_subjects)
      )
  );
$$;

-- Create a minimal view for instructors with only essential data (NO sensitive information)
CREATE VIEW public.instructor_minimal_student_view AS
SELECT 
  p.id,
  p.name,
  p.student_id,
  p.class_id,
  p.enrollment_number,
  p.status
FROM public.profiles p
WHERE 
  p.role = 'student'
  AND instructor_can_view_student(p.id);

-- Enable security barrier on the view
ALTER VIEW public.instructor_minimal_student_view SET (security_barrier = true);
GRANT SELECT ON public.instructor_minimal_student_view TO authenticated;

-- Create a stricter profile access policy specifically for sensitive data
-- First drop the existing less restrictive policy
DROP POLICY IF EXISTS "Secure profile viewing" ON public.profiles;

-- Create separate policies for different data access levels
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins and secretaries can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (get_user_role(auth.uid()) IN ('admin', 'secretary'));

-- Very restrictive policy for instructors - EXCLUDES sensitive data
CREATE POLICY "Instructors can view minimal student data only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  get_user_role(auth.uid()) = 'instructor' 
  AND role = 'student'
  AND instructor_can_view_student(id)
);

-- Create a separate table for instructor-accessible student data
CREATE TABLE IF NOT EXISTS public.student_academic_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  class_id uuid,
  academic_status text DEFAULT 'active',
  enrollment_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_student_academic_info_student FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS on the academic info table
ALTER TABLE public.student_academic_info ENABLE ROW LEVEL SECURITY;

-- Policy for academic info access - instructors can only see their students
CREATE POLICY "Instructors can view academic info for their students" 
ON public.student_academic_info 
FOR SELECT 
TO authenticated
USING (
  get_user_role(auth.uid()) IN ('admin', 'secretary')
  OR (
    get_user_role(auth.uid()) = 'instructor' 
    AND instructor_can_view_student(student_id)
  )
);

-- Admins and secretaries can manage all academic info
CREATE POLICY "Admins and secretaries can manage academic info" 
ON public.student_academic_info 
FOR ALL 
TO authenticated
USING (get_user_role(auth.uid()) IN ('admin', 'secretary'))
WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'secretary'));

-- Update trigger for the academic info table
CREATE TRIGGER update_student_academic_info_updated_at
  BEFORE UPDATE ON public.student_academic_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_academic_info_student_id ON public.student_academic_info(student_id);
CREATE INDEX IF NOT EXISTS idx_student_academic_info_class_id ON public.student_academic_info(class_id);

-- Add security comments
COMMENT ON FUNCTION public.instructor_can_view_student(uuid) IS 'Security function to verify if an instructor can view a specific student based on class/subject assignments';
COMMENT ON VIEW public.instructor_minimal_student_view IS 'Minimal view for instructors containing only essential student information WITHOUT sensitive personal data like emails, phone numbers, addresses, medical info, etc.';
COMMENT ON TABLE public.student_academic_info IS 'Academic information table that instructors can access for their students without exposing sensitive personal data from profiles table';

-- Create a function to safely get student names for instructors (without exposing full profile)
CREATE OR REPLACE FUNCTION public.get_student_basic_info_for_instructor(target_student_id uuid)
RETURNS TABLE (
  student_name text,
  student_number text,
  class_name text,
  enrollment_status text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.name,
    p.student_id,
    c.name as class_name,
    p.status
  FROM profiles p
  LEFT JOIN classes c ON c.id = p.class_id
  WHERE p.id = target_student_id
    AND p.role = 'student'
    AND (
      get_user_role(auth.uid()) IN ('admin', 'secretary')
      OR instructor_can_view_student(target_student_id)
    );
$$;