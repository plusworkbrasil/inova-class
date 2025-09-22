-- Add missing roles to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'coordinator';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'tutor';