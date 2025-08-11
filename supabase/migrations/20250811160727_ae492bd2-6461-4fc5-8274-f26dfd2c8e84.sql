-- Criar tabela de communications no Supabase
CREATE TABLE public.communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  target_audience TEXT[] DEFAULT ARRAY['student']::TEXT[],
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_by_role TEXT DEFAULT 'admin' CHECK (created_by_role IN ('admin', 'secretary', 'coordinator')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos podem ver comunicações publicadas" 
ON public.communications 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Secretaria e admin podem gerenciar todas as comunicações" 
ON public.communications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'secretary')
  )
);

CREATE POLICY "Coordenador pode gerenciar suas próprias comunicações"
ON public.communications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'coordinator'
    AND (created_by = auth.uid() OR created_by IS NULL)
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_communications_updated_at
  BEFORE UPDATE ON public.communications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();