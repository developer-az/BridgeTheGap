-- Add public_id column to users table
-- This allows users to share their unique ID to connect

-- Add the column
ALTER TABLE users ADD COLUMN IF NOT EXISTS public_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_public_id ON users(public_id);

-- Function to generate a random 8-character public ID
CREATE OR REPLACE FUNCTION generate_public_id() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excluding confusing characters like O, 0, I, 1
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Generate public IDs for existing users
DO $$
DECLARE
  user_record RECORD;
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  FOR user_record IN SELECT id FROM users WHERE public_id IS NULL LOOP
    LOOP
      new_id := generate_public_id();
      SELECT EXISTS(SELECT 1 FROM users WHERE public_id = new_id) INTO id_exists;
      EXIT WHEN NOT id_exists;
    END LOOP;
    UPDATE users SET public_id = new_id WHERE id = user_record.id;
  END LOOP;
END $$;

-- Make public_id NOT NULL after generating IDs for existing users
ALTER TABLE users ALTER COLUMN public_id SET NOT NULL;

-- Create trigger to auto-generate public_id for new users
CREATE OR REPLACE FUNCTION set_public_id() RETURNS TRIGGER AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  IF NEW.public_id IS NULL THEN
    LOOP
      new_id := generate_public_id();
      SELECT EXISTS(SELECT 1 FROM users WHERE public_id = new_id) INTO id_exists;
      EXIT WHEN NOT id_exists;
    END LOOP;
    NEW.public_id := new_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_public_id
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_public_id();

-- Update RLS policy to allow viewing users by public_id
CREATE POLICY "Users can view profiles by public_id" ON users
  FOR SELECT USING (auth.role() = 'authenticated');



