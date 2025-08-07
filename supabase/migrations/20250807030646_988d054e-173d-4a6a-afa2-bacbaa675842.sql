-- Adicionar campos necessários à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS cep text,
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS number text,
ADD COLUMN IF NOT EXISTS complement text,
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS avatar text,
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS photo text,
ADD COLUMN IF NOT EXISTS parent_name text,
ADD COLUMN IF NOT EXISTS escolaridade text,
ADD COLUMN IF NOT EXISTS guardian_name text,
ADD COLUMN IF NOT EXISTS guardian_phone text,
ADD COLUMN IF NOT EXISTS enrollment_date date,
ADD COLUMN IF NOT EXISTS teacher_id text,
ADD COLUMN IF NOT EXISTS class_id uuid;

-- Criar tabela classes (turmas)
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  grade text NOT NULL,
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  teacher_id uuid REFERENCES public.profiles(id),
  student_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Criar tabela subjects (matérias)
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  teacher_id uuid REFERENCES public.profiles(id),
  class_id uuid REFERENCES public.classes(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Criar tabela attendance (frequência)
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.profiles(id) NOT NULL,
  class_id uuid REFERENCES public.classes(id) NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) NOT NULL,
  date date NOT NULL,
  is_present boolean NOT NULL,
  justification text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(student_id, subject_id, date)
);

-- Criar tabela grades (notas)
CREATE TABLE IF NOT EXISTS public.grades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.profiles(id) NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) NOT NULL,
  value numeric(5,2) NOT NULL,
  max_value numeric(5,2) NOT NULL DEFAULT 10.00,
  type text NOT NULL CHECK (type IN ('test', 'assignment', 'project', 'final')),
  date date NOT NULL,
  teacher_id uuid REFERENCES public.profiles(id) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Criar tabela evasions (evasões)
CREATE TABLE IF NOT EXISTS public.evasions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.profiles(id) NOT NULL,
  reason text NOT NULL,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'confirmed')),
  observations text,
  reported_by uuid REFERENCES public.profiles(id) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Criar tabela communications (comunicações)
CREATE TABLE IF NOT EXISTS public.communications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('announcement', 'notice', 'event', 'alert')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_audience text[] NOT NULL, -- ['admin', 'instructor', 'student', etc.]
  author_id uuid REFERENCES public.profiles(id) NOT NULL,
  published_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_published boolean DEFAULT false,
  attachments text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Habilitar RLS em todas as novas tabelas
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evasions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para classes
CREATE POLICY "Admins and secretaries can manage all classes" ON public.classes
  FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'secretary'::app_role]));

CREATE POLICY "Instructors can view all classes" ON public.classes
  FOR SELECT USING (get_user_role(auth.uid()) = 'instructor'::app_role);

CREATE POLICY "Students can view their own class" ON public.classes
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'student'::app_role AND
    id IN (SELECT class_id FROM public.profiles WHERE id = auth.uid())
  );

-- Políticas RLS para subjects
CREATE POLICY "Admins and secretaries can manage all subjects" ON public.subjects
  FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'secretary'::app_role]));

CREATE POLICY "Instructors can manage their subjects" ON public.subjects
  FOR ALL USING (
    get_user_role(auth.uid()) = 'instructor'::app_role AND
    (teacher_id = auth.uid() OR name = ANY(
      SELECT unnest(instructor_subjects) FROM public.profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Students can view subjects from their class" ON public.subjects
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'student'::app_role AND
    class_id IN (SELECT class_id FROM public.profiles WHERE id = auth.uid())
  );

-- Políticas RLS para attendance
CREATE POLICY "Admins and secretaries can manage all attendance" ON public.attendance
  FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'secretary'::app_role]));

CREATE POLICY "Instructors can manage attendance for their subjects" ON public.attendance
  FOR ALL USING (
    get_user_role(auth.uid()) = 'instructor'::app_role AND
    subject_id IN (
      SELECT s.id FROM public.subjects s 
      WHERE s.teacher_id = auth.uid() OR s.name = ANY(
        SELECT unnest(instructor_subjects) FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Students can view their own attendance" ON public.attendance
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'student'::app_role AND
    student_id = auth.uid()
  );

-- Políticas RLS para grades
CREATE POLICY "Admins and secretaries can manage all grades" ON public.grades
  FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'secretary'::app_role]));

CREATE POLICY "Instructors can manage grades for their subjects" ON public.grades
  FOR ALL USING (
    get_user_role(auth.uid()) = 'instructor'::app_role AND
    subject_id IN (
      SELECT s.id FROM public.subjects s 
      WHERE s.teacher_id = auth.uid() OR s.name = ANY(
        SELECT unnest(instructor_subjects) FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Students can view their own grades" ON public.grades
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'student'::app_role AND
    student_id = auth.uid()
  );

-- Políticas RLS para evasions
CREATE POLICY "Admins and secretaries can manage all evasions" ON public.evasions
  FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'secretary'::app_role]));

CREATE POLICY "Instructors can create and view evasions" ON public.evasions
  FOR ALL USING (get_user_role(auth.uid()) = 'instructor'::app_role);

CREATE POLICY "Students can view their own evasions" ON public.evasions
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'student'::app_role AND
    student_id = auth.uid()
  );

-- Políticas RLS para communications
CREATE POLICY "Admins and secretaries can manage all communications" ON public.communications
  FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'secretary'::app_role]));

CREATE POLICY "Users can view published communications targeted to them" ON public.communications
  FOR SELECT USING (
    is_published = true AND
    published_at <= now() AND
    (expires_at IS NULL OR expires_at > now()) AND
    get_user_role(auth.uid())::text = ANY(target_audience)
  );

CREATE POLICY "Instructors can create communications" ON public.communications
  FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) = 'instructor'::app_role AND
    author_id = auth.uid()
  );

-- Adicionar triggers para updated_at
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grades_updated_at
  BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evasions_updated_at
  BEFORE UPDATE ON public.evasions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communications_updated_at
  BEFORE UPDATE ON public.communications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON public.subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON public.subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_subject_id ON public.attendance(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_evasions_student_id ON public.evasions(student_id);
CREATE INDEX IF NOT EXISTS idx_communications_target_audience ON public.communications USING GIN(target_audience);
CREATE INDEX IF NOT EXISTS idx_communications_published_at ON public.communications(published_at);
CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON public.profiles(class_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);