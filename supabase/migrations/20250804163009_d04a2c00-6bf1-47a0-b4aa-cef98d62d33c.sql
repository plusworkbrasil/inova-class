-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'secretary', 'instructor', 'student');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  student_id TEXT,
  instructor_subjects TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create declarations table
CREATE TABLE public.declarations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('medical_certificate', 'enrollment_certificate')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  title TEXT NOT NULL,
  description TEXT,
  purpose TEXT,
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  subject_id TEXT,
  file_path TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES public.profiles(id),
  delivery_date DATE,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on declarations
ALTER TABLE public.declarations ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for declaration files
INSERT INTO storage.buckets (id, name, public) VALUES ('declarations', 'declarations', false);

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Create security definer function to check if user is instructor of subject
CREATE OR REPLACE FUNCTION public.is_instructor_of_subject(user_id UUID, subject TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT subject = ANY(instructor_subjects) FROM public.profiles WHERE id = user_id AND role = 'instructor';
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins and secretaries can view all profiles"
ON public.profiles FOR SELECT
USING (public.get_user_role(auth.uid()) IN ('admin', 'secretary'));

-- Declarations RLS policies
CREATE POLICY "Students can view their own declarations"
ON public.declarations FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can create their own declarations"
ON public.declarations FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own pending declarations"
ON public.declarations FOR UPDATE
USING (student_id = auth.uid() AND status = 'pending');

CREATE POLICY "Secretaries can view all declarations"
ON public.declarations FOR SELECT
USING (public.get_user_role(auth.uid()) IN ('admin', 'secretary'));

CREATE POLICY "Secretaries can update declarations"
ON public.declarations FOR UPDATE
USING (public.get_user_role(auth.uid()) IN ('admin', 'secretary'));

CREATE POLICY "Instructors can view declarations from their subjects"
ON public.declarations FOR SELECT
USING (
  public.get_user_role(auth.uid()) = 'instructor' 
  AND public.is_instructor_of_subject(auth.uid(), subject_id)
  AND type = 'medical_certificate'
);

-- Storage policies for declarations bucket
CREATE POLICY "Users can view their own declaration files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'declarations' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own declaration files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'declarations' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Secretaries can view all declaration files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'declarations' 
  AND public.get_user_role(auth.uid()) IN ('admin', 'secretary')
);

CREATE POLICY "Secretaries can upload declaration files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'declarations' 
  AND public.get_user_role(auth.uid()) IN ('admin', 'secretary')
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_declarations_updated_at
BEFORE UPDATE ON public.declarations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'name', new.email),
    new.email,
    'student'
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();