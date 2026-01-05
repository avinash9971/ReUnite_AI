import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
};

export type MissingPerson = {
  id: string;
  reporter_id: string;
  full_name: string;
  address: string;
  aadhaar_number: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  image_url: string;
  image_year: number;
  missing_from: string;
  status: 'active' | 'found' | 'closed';
  created_at: string;
  updated_at: string;
};

export type FoundPerson = {
  id: string;
  admin_id: string;
  image_url: string;
  matched_person_id: string | null;
  match_confidence: number | null;
  created_at: string;
};
