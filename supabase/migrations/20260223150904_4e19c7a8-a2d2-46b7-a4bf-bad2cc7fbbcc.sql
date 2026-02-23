
-- Create selected_students table
CREATE TABLE public.selected_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  cpf text NOT NULL,
  shift text,
  confirmed_shift text,
  status text NOT NULL DEFAULT 'pending',
  invite_token uuid UNIQUE,
  token_expires_at timestamptz,
  token_used_at timestamptz,
  confirmed_at timestamptz,
  enrolled_at timestamptz,
  enrolled_user_id uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT selected_students_email_key UNIQUE (email)
);

-- Indexes
CREATE INDEX idx_selected_students_status ON public.selected_students(status);
CREATE INDEX idx_selected_students_email ON public.selected_students(email);
CREATE INDEX idx_selected_students_invite_token ON public.selected_students(invite_token) WHERE invite_token IS NOT NULL;

-- Enable RLS
ALTER TABLE public.selected_students ENABLE ROW LEVEL SECURITY;

-- RLS: Admin and secretary full access
CREATE POLICY "Admins and secretaries can manage selected students"
ON public.selected_students
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'secretary'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'secretary'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_selected_students_updated_at
BEFORE UPDATE ON public.selected_students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
