-- Add missing fields to equipment table
ALTER TABLE public.equipment 
ADD COLUMN patrimonio text,
ADD COLUMN description text;

-- Create enum for shifts
CREATE TYPE public.shift_type AS ENUM ('manha', 'tarde', 'noite');

-- Create enum for allocation status
CREATE TYPE public.allocation_status AS ENUM ('ativo', 'finalizado', 'cancelado');

-- Create equipment_allocations table
CREATE TABLE public.equipment_allocations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  allocated_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shift shift_type NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status allocation_status NOT NULL DEFAULT 'ativo',
  allocated_at timestamp with time zone NOT NULL DEFAULT now(),
  returned_at timestamp with time zone,
  observations text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent double allocation
CREATE UNIQUE INDEX idx_equipment_allocation_unique 
ON public.equipment_allocations (equipment_id, date, shift) 
WHERE status = 'ativo';

-- Enable RLS
ALTER TABLE public.equipment_allocations ENABLE ROW LEVEL SECURITY;

-- RLS policies for equipment_allocations
CREATE POLICY "Admins and secretaries can manage all allocations"
ON public.equipment_allocations
FOR ALL 
USING (get_user_role(auth.uid()) = ANY(ARRAY['admin'::app_role, 'secretary'::app_role]));

CREATE POLICY "Instructors can view allocations"
ON public.equipment_allocations
FOR SELECT
USING (get_user_role(auth.uid()) = 'instructor'::app_role);

CREATE POLICY "Students can view their own allocations"
ON public.equipment_allocations
FOR SELECT
USING (get_user_role(auth.uid()) = 'student'::app_role AND student_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_equipment_allocations_updated_at
BEFORE UPDATE ON public.equipment_allocations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();