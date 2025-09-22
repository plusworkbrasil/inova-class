-- Create RLS policies for declarations storage bucket

-- Allow students to upload their own files
CREATE POLICY "Students can upload their own declaration files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'declarations' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND get_user_role(auth.uid()) = 'student'
);

-- Allow students to view their own files
CREATE POLICY "Students can view their own declaration files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'declarations' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND get_user_role(auth.uid()) = 'student'
);

-- Allow admins and secretaries to view all declaration files
CREATE POLICY "Admins and secretaries can view all declaration files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'declarations' 
  AND get_user_role(auth.uid()) IN ('admin', 'secretary')
);

-- Allow admins and secretaries to manage all declaration files
CREATE POLICY "Admins and secretaries can manage all declaration files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'declarations' 
  AND get_user_role(auth.uid()) IN ('admin', 'secretary')
);