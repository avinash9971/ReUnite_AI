/*
  # Add Admin Update Policy for Found Persons

  1. Changes
    - Add RLS policy to allow admins to update found person records
    - This enables admins to set matched_person_id and match_confidence when confirming matches

  2. Security
    - Policy restricts updates to authenticated admin users only
    - Required for the matching confirmation workflow
*/

CREATE POLICY "Admins can update found person records"
  ON found_persons
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
