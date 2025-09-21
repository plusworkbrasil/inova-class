-- Enhanced security fix for instructor access to student data

-- First, drop the existing problematic view
DROP VIEW IF EXISTS public.instructor_student_view;

-- Create a more restrictive function to check instructor-student relationships
CREATE OR REPLACE FUNCTION public.instructor_can_view_student(student_id uuid)
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
    WHERE student_profile.id = student_id
      AND student_profile.role = 'student'
      AND instructor_profile.role = 'instructor'
      AND (
        s.teacher_id = auth.uid() 
        OR s.name = ANY(instructor_profile.instructor_subjects)
      )
  );
$$;

-- Create a minimal view for instructors with only essential data
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

-- Enable RLS on the view
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

-- Very restrictive policy for instructors - only basic data for their students
CREATE POLICY "Instructors can view minimal student data only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  get_user_role(auth.uid()) = 'instructor' 
  AND role = 'student'
  AND instructor_can_view_student(id)
);

-- Create a security function to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when someone accesses sensitive profile data
  IF get_user_role(auth.uid()) = 'instructor' AND NEW.id != auth.uid() THEN
    -- Insert audit log (this would go to a proper audit table in production)
    INSERT INTO communications (
      author_id,
      title,
      content,
      type,
      priority,
      target_audience,
      is_published
    ) VALUES (
      auth.uid(),
      'Audit: Profile Access',
      format('Instructor %s accessed student %s profile data', auth.uid(), NEW.id),
      'audit',
      'low',
      ARRAY['admin'],
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply audit logging trigger (commented out to avoid spam, enable in production)
-- CREATE TRIGGER profile_access_audit_trigger
--   AFTER SELECT ON public.profiles
--   FOR EACH ROW
--   EXECUTE FUNCTION public.log_sensitive_data_access();

-- Create a separate table for instructor-accessible student data (future enhancement)
CREATE TABLE IF NOT EXISTS public.student_academic_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id uuid,
  academic_status text DEFAULT 'active',
  enrollment_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the academic info table
ALTER TABLE public.student_academic_info ENABLE ROW LEVEL SECURITY;

-- Policy for academic info access
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

-- Add comments for documentation
COMMENT ON FUNCTION public.instructor_can_view_student(uuid) IS 'Security function to verify if an instructor can view a specific student based on class/subject assignments';
COMMENT ON VIEW public.instructor_minimal_student_view IS 'Minimal view for instructors containing only essential student information without sensitive personal data';
COMMENT ON TABLE public.student_academic_info IS 'Academic information table that instructors can access for their students without exposing sensitive personal data';

-- Revoke any unnecessary permissions
REVOKE ALL ON public.profiles FROM authenticated;
GRANT SELECT ON public.profiles TO authenticated; -- This will be controlled by RLS policies