-- Create the test user admin@escola.com with admin role
-- First, we need to insert into auth.users (this will be handled by Supabase auth)
-- Then create the profile

-- Note: Since we can't directly insert into auth.users, we need to use Supabase auth signup
-- But we can prepare the profile structure and create a function to handle test data

-- Create a function to setup test data after user signup
CREATE OR REPLACE FUNCTION setup_test_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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