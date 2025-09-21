-- Remove grade column from classes table as it's no longer needed
ALTER TABLE public.classes DROP COLUMN IF EXISTS grade;