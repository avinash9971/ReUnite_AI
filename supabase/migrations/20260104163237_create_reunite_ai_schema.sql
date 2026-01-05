/*
  # ReUnite AI - Missing Person Identification System Schema

  ## Overview
  Initial database schema for the Missing Person Identification System.
  This migration creates the core tables needed for user management and missing person reports.

  ## New Tables
  
  ### `profiles`
  Extends Supabase auth.users with role information
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, not null)
  - `full_name` (text)
  - `role` (text, not null) - either 'user' or 'admin'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `missing_persons`
  Stores reports of missing persons submitted by users
  - `id` (uuid, primary key)
  - `reporter_id` (uuid, references profiles)
  - `full_name` (text, not null)
  - `address` (text, not null)
  - `aadhaar_number` (text, not null)
  - `gender` (text, not null)
  - `age` (integer, not null)
  - `image_url` (text, not null)
  - `image_year` (integer, not null)
  - `missing_from` (text, not null) - place where person went missing
  - `status` (text) - 'active', 'found', 'closed'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `found_persons`
  Stores records of found persons uploaded by admins
  - `id` (uuid, primary key)
  - `admin_id` (uuid, references profiles)
  - `image_url` (text, not null)
  - `matched_person_id` (uuid, references missing_persons)
  - `match_confidence` (numeric)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can read their own profile and create missing person reports
  - Admins can read all data and create found person records
  - Public can read missing persons data (for matching purposes)
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create missing_persons table
CREATE TABLE IF NOT EXISTS missing_persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  address text NOT NULL,
  aadhaar_number text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  age integer NOT NULL CHECK (age > 0 AND age < 150),
  image_url text NOT NULL,
  image_year integer NOT NULL CHECK (image_year >= 1900 AND image_year <= 2100),
  missing_from text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'found', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create found_persons table
CREATE TABLE IF NOT EXISTS found_persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  matched_person_id uuid REFERENCES missing_persons(id) ON DELETE SET NULL,
  match_confidence numeric CHECK (match_confidence >= 0 AND match_confidence <= 100),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE missing_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE found_persons ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Missing persons policies
CREATE POLICY "Anyone can view missing persons"
  ON missing_persons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create missing person reports"
  ON missing_persons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can update their own reports"
  ON missing_persons FOR UPDATE
  TO authenticated
  USING (auth.uid() = reporter_id)
  WITH CHECK (auth.uid() = reporter_id);

-- Found persons policies
CREATE POLICY "Admins can view all found persons"
  ON found_persons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create found person records"
  ON found_persons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_missing_persons_status ON missing_persons(status);
CREATE INDEX IF NOT EXISTS idx_missing_persons_reporter ON missing_persons(reporter_id);
CREATE INDEX IF NOT EXISTS idx_found_persons_admin ON found_persons(admin_id);
CREATE INDEX IF NOT EXISTS idx_found_persons_matched ON found_persons(matched_person_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_missing_persons_updated_at
  BEFORE UPDATE ON missing_persons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();