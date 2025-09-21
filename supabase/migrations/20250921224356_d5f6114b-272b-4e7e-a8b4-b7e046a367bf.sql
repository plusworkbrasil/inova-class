-- Fix Security Definer View issue
-- Drop the problematic instructor_student_view that bypasses RLS
DROP VIEW IF EXISTS public.instructor_student_view;

-- The functionality is already properly handled by:
-- 1. get_instructor_students() function with proper security
-- 2. instructor_can_view_student() function for access control
-- 3. RLS policies on profiles table that enforce proper access control

-- These existing functions already provide secure access to student data
-- without bypassing RLS policies like the SECURITY DEFINER view was doing