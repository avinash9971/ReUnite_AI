/*
  # Add Image Type Support

  ## Changes
  Add `image_type` column to both `missing_persons` and `found_persons` tables
  to support different image types (sketch, younger, blurry/CCTV).

  ## New Columns
  
  ### `missing_persons`
  - `image_type` (text) - Type of uploaded image: 'sketch', 'younger', or 'blurry'

  ### `found_persons`
  - `image_type` (text) - Type of uploaded image: 'sketch', 'younger', or 'blurry'
  - `images` (jsonb) - Array of image objects with url and type for multiple images

  ## Notes
  - Helps the AI matching system choose appropriate algorithms
  - Supports multiple image uploads for found persons
*/

-- Add image_type to missing_persons table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missing_persons' AND column_name = 'image_type'
  ) THEN
    ALTER TABLE missing_persons 
    ADD COLUMN image_type text CHECK (image_type IN ('sketch', 'younger', 'blurry'));
  END IF;
END $$;

-- Add image_type and images to found_persons table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'found_persons' AND column_name = 'image_type'
  ) THEN
    ALTER TABLE found_persons 
    ADD COLUMN image_type text CHECK (image_type IN ('sketch', 'younger', 'blurry'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'found_persons' AND column_name = 'images'
  ) THEN
    ALTER TABLE found_persons 
    ADD COLUMN images jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_missing_persons_image_type ON missing_persons(image_type);
CREATE INDEX IF NOT EXISTS idx_found_persons_image_type ON found_persons(image_type);
