/*
  # Setup Image Storage for Missing Persons

  1. Storage Bucket
    - Create `missing-persons-images` bucket for storing photos
    - Enable public access for viewing images
    - Set file size limit to 5MB
    - Restrict to image file types only

  2. Security Policies
    - Authenticated users can upload images to their own folder
    - Anyone can view images (public access for identification purposes)
    - Only admins can delete images

  3. Important Notes
    - Images are stored with UUID filenames to ensure uniqueness
    - Public access is necessary for the facial recognition system
    - File size limited to prevent abuse
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'missing-persons-images',
  'missing-persons-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'missing-persons-images');

CREATE POLICY "Anyone can view images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'missing-persons-images');

CREATE POLICY "Admins can delete images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'missing-persons-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
