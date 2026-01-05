/*
  # Setup Storage for Found Persons Images

  1. Storage Setup
    - Create `found-persons-images` storage bucket for admin uploads
    - Configure public access for found person images
    - Set file size limits and allowed mime types

  2. Security
    - Allow authenticated admins to upload images
    - Allow public read access for matching system
    - Restrict uploads to image files only (JPEG, PNG, WebP)
    - Set maximum file size to 5MB

  ## Important Notes
  - Only admins can upload images
  - Images are publicly readable for the matching system
  - Automatic cleanup of old images can be configured separately
*/

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'found-persons-images',
    'found-persons-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

CREATE POLICY "Admins can upload found person images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'found-persons-images' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can view found person images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'found-persons-images');

CREATE POLICY "Admins can delete found person images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'found-persons-images' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
