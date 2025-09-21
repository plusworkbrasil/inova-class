-- Insert missing school name setting
INSERT INTO public.system_settings (category, key, value) 
VALUES ('school', 'name', '"Nome da Escola"')
ON CONFLICT (category, key) DO NOTHING;