-- Quick check to see if name field exists and has data
-- Run this in Supabase SQL Editor

-- 1. Check if name column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'name';

-- 2. Check users and their name values
SELECT 
  id,
  email,
  name,
  university_name,
  CASE 
    WHEN name IS NULL THEN '❌ NULL'
    WHEN name = '' THEN '⚠️ Empty'
    ELSE '✅ Has name'
  END as name_status
FROM users
LIMIT 10;

-- 3. Count users with/without names
SELECT 
  COUNT(*) as total_users,
  COUNT(name) as users_with_name,
  COUNT(*) - COUNT(name) as users_without_name
FROM users;

