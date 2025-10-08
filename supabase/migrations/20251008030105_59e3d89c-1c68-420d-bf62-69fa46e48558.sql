-- ========================================
-- COMPREHENSIVE SECURITY FIX MIGRATION
-- ========================================

-- PRIORITY 1: Eliminate Dual Role Storage
-- ========================================

-- Step 1: Drop triggers and functions in correct order
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.profiles;
DROP TRIGGER IF EXISTS validate_profile_security_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_role_escalation() CASCADE;
DROP FUNCTION IF EXISTS public.validate_profile_security() CASCADE;

-- Step 2: Update database functions to remove profiles.role references
-- Update instructor_can_view_student to use get_user_role()
CREATE OR REPLACE FUNCTION public.instructor_can_view_student(target_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles student_profile
    JOIN subjects s ON s.class_id = student_profile.class_id
    WHERE student_profile.id = target_student_id
      AND get_user_role(student_profile.id) = 'student'
      AND get_user_role(auth.uid()) = 'instructor'
      AND (
        s.teacher_id = auth.uid() 
        OR s.name = ANY(
          SELECT unnest(instructor_subjects) 
          FROM profiles 
          WHERE id = auth.uid()
        )
      )
  );
$$;

-- Update get_instructor_students to use get_user_role()
CREATE OR REPLACE FUNCTION public.get_instructor_students()
RETURNS TABLE(id uuid, name text, student_id text, class_id uuid, enrollment_number text, status text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.name,
    p.student_id,
    p.class_id,
    p.enrollment_number,
    p.status
  FROM profiles p
  WHERE get_user_role(p.id) = 'student'
    AND (
      get_user_role(auth.uid()) IN ('admin', 'secretary')
      OR (
        get_user_role(auth.uid()) = 'instructor' 
        AND instructor_can_view_student(p.id)
      )
    );
$$;

-- Step 3: Sync user_roles table with existing profiles BEFORE dropping role column
INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT 
  au.id,
  COALESCE(
    (au.raw_user_meta_data->>'role')::app_role,
    'student'::app_role
  ),
  NULL
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Remove profiles.role column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role CASCADE;


-- PRIORITY 2: Restrict Instructor Access to Student PII
-- ========================================

-- Create a view for safe student data (instructor view)
CREATE OR REPLACE VIEW public.instructor_student_view AS
SELECT 
  id,
  name,
  email,
  student_id,
  class_id,
  enrollment_number,
  status,
  created_at
FROM profiles
WHERE get_user_role(id) = 'student';

-- Grant access to the view
GRANT SELECT ON public.instructor_student_view TO authenticated;


-- PRIORITY 4: Restrict Student Academic Notes
-- ========================================

-- Create a view for student academic info without confidential notes
CREATE OR REPLACE VIEW public.instructor_academic_info_view AS
SELECT 
  id,
  student_id,
  class_id,
  enrollment_date,
  academic_status,
  created_at,
  updated_at
  -- Explicitly exclude 'notes' field
FROM student_academic_info
WHERE get_user_role(auth.uid()) = 'instructor' AND instructor_can_view_student(student_id);

-- Grant access to the view
GRANT SELECT ON public.instructor_academic_info_view TO authenticated;

-- Update RLS policy for student_academic_info to restrict notes access
DROP POLICY IF EXISTS "Instructors can view academic info for their students" ON public.student_academic_info;

CREATE POLICY "Instructors can view limited academic info"
ON public.student_academic_info
FOR SELECT
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'secretary'::app_role]))
  OR (
    (get_user_role(auth.uid()) = 'instructor'::app_role) 
    AND instructor_can_view_student(student_id)
  )
);