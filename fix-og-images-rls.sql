-- Fix RLS policy for og-images storage bucket
-- This allows authenticated users to upload OG images

-- First, check if the bucket exists and create it if it doesn't
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'og-images',
  'og-images', 
  true,  -- Make it public so OG images can be accessed
  5242880,  -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload OG images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to OG images" ON storage.objects;

-- Create policy for authenticated users to upload OG images
CREATE POLICY "Allow authenticated users to upload OG images" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'og-images');

-- Create policy for authenticated users to update OG images (for overwriting)
CREATE POLICY "Allow authenticated users to update OG images" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'og-images');

-- Create policy for public read access to OG images
CREATE POLICY "Allow public read access to OG images" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'og-images');

-- Optional: Create policy for authenticated users to delete OG images (if needed)
CREATE POLICY "Allow authenticated users to delete OG images" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'og-images');

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
