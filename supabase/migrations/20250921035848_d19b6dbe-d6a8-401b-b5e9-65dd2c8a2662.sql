-- Fix security definer view issue

-- Drop the problematic security definer view
DROP VIEW IF EXISTS public.instructor_student_view;

-- Create a regular view without security definer (RLS policies will handle access control)
CREATE VIEW public.instructor_student_view AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.student_id,
  p.class_id,
  p.enrollment_date,
  p.status,
  p.enrollment_number
FROM public.profiles p
WHERE 
  p.role = 'student';

-- Grant access to the view
GRANT SELECT ON public.instructor_student_view TO authenticated;

-- Update remaining functions to set search_path properly
CREATE OR REPLACE FUNCTION public.setup_test_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function can be called after creating the test user via Supabase auth
  -- It will update the profile to admin role
  UPDATE profiles 
  SET role = 'admin'
  WHERE email = 'admin@escola.com';
  
  -- Create some test classes
  INSERT INTO classes (name, grade, year, student_count) VALUES
  ('Turma A', '1º Ano', 2024, 25),
  ('Turma B', '1º Ano', 2024, 22),
  ('Turma C', '2º Ano', 2024, 28)
  ON CONFLICT DO NOTHING;

  -- Create some test subjects
  INSERT INTO subjects (name) VALUES
  ('Matemática'),
  ('Português'),
  ('História'),
  ('Geografia'),
  ('Ciências')
  ON CONFLICT DO NOTHING;
  
END;
$$;

CREATE OR REPLACE FUNCTION public.is_instructor_of_subject(user_id uuid, subject text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT subject = ANY(instructor_subjects) FROM public.profiles WHERE id = user_id AND role = 'instructor';
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'name', new.email),
    new.email,
    COALESCE((new.raw_user_meta_data ->> 'role')::app_role, 'student')
  );
  RETURN new;
END;
$$;