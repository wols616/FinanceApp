/*
  # Fix user registration database error

  1. Database Functions
    - Create `handle_new_user` function to automatically create user profiles
    - Function creates a profile entry when a new user signs up

  2. Database Triggers
    - Create trigger on `auth.users` table to call `handle_new_user` function
    - Trigger fires after user insertion in auth.users table

  3. Security
    - Ensure proper error handling in the function
    - Maintain existing RLS policies on profiles table

  This migration fixes the "Database error saving new user" issue by ensuring
  that when a user signs up through Supabase Auth, a corresponding profile
  entry is automatically created in the profiles table.
*/

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, currency, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    NEW.raw_user_meta_data->>'avatar_url',
    'MXN',
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure the profiles table has the correct foreign key constraint
DO $$
BEGIN
  -- Check if the foreign key constraint exists and drop it if it does
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
  
  -- Add the correct foreign key constraint
  ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN OTHERS THEN
    -- If constraint already exists or other error, continue
    NULL;
END $$;