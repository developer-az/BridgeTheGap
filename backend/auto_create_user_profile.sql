-- Auto-create user profile when auth user signs up
-- This ensures every auth user has a corresponding row in the users table

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_public_id TEXT;
  id_exists BOOLEAN;
  default_name TEXT;
BEGIN
  -- Generate public_id
  LOOP
    new_public_id := generate_public_id();
    SELECT EXISTS(SELECT 1 FROM users WHERE public_id = new_public_id) INTO id_exists;
    EXIT WHEN NOT id_exists;
  END LOOP;

  -- Extract name from email (before @) as default
  default_name := SPLIT_PART(NEW.email, '@', 1);

  -- Insert into public.users table
  INSERT INTO public.users (id, email, name, public_id, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    default_name,
    new_public_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Don't error if user already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also create a function to handle existing users who don't have profiles
-- This can be run manually or via a cron job
CREATE OR REPLACE FUNCTION public.create_missing_user_profiles()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  new_public_id TEXT;
  id_exists BOOLEAN;
  default_name TEXT;
  created_count INTEGER := 0;
BEGIN
  -- Loop through auth users who don't have profiles
  FOR user_record IN 
    SELECT au.id, au.email
    FROM auth.users au
    LEFT JOIN public.users u ON au.id = u.id
    WHERE u.id IS NULL
  LOOP
    -- Generate public_id
    LOOP
      new_public_id := generate_public_id();
      SELECT EXISTS(SELECT 1 FROM users WHERE public_id = new_public_id) INTO id_exists;
      EXIT WHEN NOT id_exists;
    END LOOP;

    -- Extract name from email as default
    default_name := SPLIT_PART(user_record.email, '@', 1);

    -- Create profile
    INSERT INTO public.users (id, email, name, public_id, created_at, updated_at)
    VALUES (
      user_record.id,
      user_record.email,
      default_name,
      new_public_id,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    created_count := created_count + 1;
  END LOOP;
  
  RETURN created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to create profiles for existing auth users
SELECT public.create_missing_user_profiles();

