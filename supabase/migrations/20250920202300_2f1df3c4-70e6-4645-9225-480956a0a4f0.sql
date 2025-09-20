-- Expandir tabela profiles para suportar todos os formulários do projeto
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS nationality text,
ADD COLUMN IF NOT EXISTS marital_status text,
ADD COLUMN IF NOT EXISTS profession text,
ADD COLUMN IF NOT EXISTS emergency_contact_name text,
ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
ADD COLUMN IF NOT EXISTS emergency_contact_relation text,
ADD COLUMN IF NOT EXISTS allergies text,
ADD COLUMN IF NOT EXISTS medical_conditions text,
ADD COLUMN IF NOT EXISTS medications text,
ADD COLUMN IF NOT EXISTS blood_type text,
ADD COLUMN IF NOT EXISTS health_insurance text,
ADD COLUMN IF NOT EXISTS previous_school text,
ADD COLUMN IF NOT EXISTS transportation text,
ADD COLUMN IF NOT EXISTS special_needs text,
ADD COLUMN IF NOT EXISTS guardian_email text,
ADD COLUMN IF NOT EXISTS guardian_cpf text,
ADD COLUMN IF NOT EXISTS guardian_profession text,
ADD COLUMN IF NOT EXISTS guardian_workplace text,
ADD COLUMN IF NOT EXISTS guardian_income text,
ADD COLUMN IF NOT EXISTS enrollment_number text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS rg text,
ADD COLUMN IF NOT EXISTS birth_place text,
ADD COLUMN IF NOT EXISTS mother_name text,
ADD COLUMN IF NOT EXISTS father_name text,
ADD COLUMN IF NOT EXISTS social_id text,
ADD COLUMN IF NOT EXISTS notes text;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON public.profiles(class_id);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_enrollment_number ON public.profiles(enrollment_number);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);