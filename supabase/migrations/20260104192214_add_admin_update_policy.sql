/*
  # Add Admin Update Policy for Missing Persons

  1. Changes
    - Add RLS policy to allow admins to update missing persons status
    - This enables admins to mark cases as 'found' when confirming matches

  2. Security
    - Policy restricts updates to authenticated admin users only
    - Admins can update any missing person record (needed for case management)
*/

CREATE POLICY "Admins can update missing persons status"
  ON missing_persons
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
