-- Update the resumes bucket to allow larger file sizes (100MB) and more mime types
UPDATE storage.buckets 
SET file_size_limit = 104857600,  -- 100MB
    allowed_mime_types = ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp'
    ]
WHERE id = 'resumes';

-- Drop existing restrictive policies for resumes bucket
DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON storage.objects;

-- Create new policies that allow public uploads for interview candidates
-- Allow anyone to upload resumes (for candidates without accounts)
CREATE POLICY "Allow public resume uploads" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'resumes');

-- Allow anyone to view resumes (needed for processing)
CREATE POLICY "Allow public resume access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'resumes');

-- Allow anyone to delete their uploaded resumes (cleanup)
CREATE POLICY "Allow resume deletion" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'resumes');