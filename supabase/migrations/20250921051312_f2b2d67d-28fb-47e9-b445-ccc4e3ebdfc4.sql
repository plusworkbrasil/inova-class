-- Create system_settings table for storing application configurations
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(category, key)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies - only admins can manage settings
CREATE POLICY "Admins can manage all settings" 
ON public.system_settings 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Secretaries can view settings" 
ON public.system_settings 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY(ARRAY['admin', 'secretary']));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.system_settings (category, key, value) VALUES
('general', 'school_name', '"Escola Municipal"'),
('general', 'academic_year', '"2024"'),
('general', 'language', '"pt-BR"'),
('general', 'timezone', '"America/Sao_Paulo"'),
('school', 'address', '"Rua Principal, 123"'),
('school', 'phone', '"(11) 1234-5678"'),
('school', 'email', '"contato@escola.edu.br"'),
('school', 'website', '"https://escola.edu.br"'),
('school', 'principal', '"Diretor da Escola"'),
('users', 'auto_approve_teachers', 'false'),
('users', 'require_email_verification', 'true'),
('users', 'password_policy', '"medium"'),
('notifications', 'email_notifications', 'true'),
('notifications', 'sms_notifications', 'false'),
('notifications', 'push_notifications', 'true'),
('notifications', 'digest_frequency', '"weekly"'),
('security', 'two_factor_auth', 'false'),
('security', 'session_timeout', '30'),
('security', 'login_attempts', '5'),
('security', 'audit_logs', 'true');