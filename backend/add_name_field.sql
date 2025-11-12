-- Add name field to users table
-- This allows users to display their actual name instead of just university name

-- Add the column (nullable for existing users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing users to use email prefix as name if name is null
UPDATE users 
SET name = SPLIT_PART(email, '@', 1)
WHERE name IS NULL;

-- Make name NOT NULL after updating existing users (optional - can keep nullable)
-- ALTER TABLE users ALTER COLUMN name SET NOT NULL;

