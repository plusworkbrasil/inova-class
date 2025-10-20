-- Step 1: Create SECURITY DEFINER functions to break RLS recursion

-- Function to check if user is instructor of a subject
CREATE OR REPLACE FUNCTION public.is_instructor_of_subject(_user_id uuid, _subject_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM subjects s
    WHERE s.id = _subject_id
      AND (
        s.teacher_id = _user_id 
        OR s.name IN (
          SELECT unnest(instructor_subjects) 
          FROM profiles 
          WHERE id = _user_id
        )
      )
  );
$$;

-- Function to check if student is in a class
CREATE OR REPLACE FUNCTION public.student_in_class(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = _user_id 
      AND class_id = _class_id
  );
$$;

-- Function to check if instructor can view a profile
CREATE OR REPLACE FUNCTION public.instructor_can_view_profile(_user_id uuid, target_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles student_profile
    JOIN subjects s ON s.class_id = student_profile.class_id
    WHERE student_profile.id = target_profile_id
      AND (
        s.teacher_id = _user_id 
        OR s.name IN (
          SELECT unnest(instructor_subjects) 
          FROM profiles 
          WHERE id = _user_id
        )
      )
  );
$$;

-- Step 2: Drop and recreate policies without recursive subselects

-- Drop problematic policies on profiles
DROP POLICY IF EXISTS "Instructors can view their class students" ON public.profiles;

-- Recreate with SECURITY DEFINER function
CREATE POLICY "Instructors can view their class students v2"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND instructor_can_view_profile(auth.uid(), id)
);

-- Drop problematic policies on subjects
DROP POLICY IF EXISTS "Instructors can manage their subjects" ON public.subjects;
DROP POLICY IF EXISTS "Students can view subjects from their class" ON public.subjects;

-- Recreate subjects policies with SECURITY DEFINER functions
CREATE POLICY "Instructors can manage their subjects v2"
ON public.subjects
FOR ALL
USING (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND is_instructor_of_subject(auth.uid(), id)
);

CREATE POLICY "Students can view subjects from their class v2"
ON public.subjects
FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role) 
  AND student_in_class(auth.uid(), class_id)
);