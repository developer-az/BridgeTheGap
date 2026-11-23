-- Quick Database Check for public_id Column
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if public_id column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'public_id';

-- 2. Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_set_public_id';

-- 3. Check users without public_id
SELECT 
  id, 
  email, 
  public_id,
  created_at
FROM users
WHERE public_id IS NULL
LIMIT 10;

-- 4. Check total users and how many have public_id
SELECT 
  COUNT(*) as total_users,
  COUNT(public_id) as users_with_id,
  COUNT(*) - COUNT(public_id) as users_without_id
FROM users;

-- 5. Check for duplicate public_ids (should be 0)
SELECT 
  public_id, 
  COUNT(*) as count
FROM users
WHERE public_id IS NOT NULL
GROUP BY public_id
HAVING COUNT(*) > 1;

