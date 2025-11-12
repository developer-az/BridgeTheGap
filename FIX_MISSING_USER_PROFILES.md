# Fix: New Accounts Not Appearing in Users Table

## Problem
When users sign up, they're created in `auth.users` but not in the `users` table. This happens because:
1. Signup only creates the auth user
2. Profile is only created when user completes `/profile/setup`
3. If user skips setup or it fails, no profile row exists

## Solution 1: Run Database Trigger (Recommended)

This will automatically create a profile for every new signup:

### Step 1: Run the SQL Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `backend/auto_create_user_profile.sql` in your code editor
3. **Copy ALL contents**
4. **Paste** into Supabase SQL Editor
5. **Click "Run"**

**What this does:**
- Creates a trigger that runs when a new auth user signs up
- Automatically creates a row in `users` table with a generated `public_id`
- Also creates profiles for existing auth users who don't have profiles

### Step 2: Verify It Worked

Run this query in Supabase SQL Editor:

```sql
-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check for auth users without profiles
SELECT COUNT(*) as missing_profiles
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;
```

**Expected Results:**
- Trigger should exist
- Missing profiles should be 0 (after running the migration)

## Solution 2: Manual Fix for Existing Users

If you have existing auth users without profiles, run:

```sql
-- Create profiles for all auth users who don't have one
SELECT public.create_missing_user_profiles();
```

Or manually:

```sql
-- For each auth user without a profile, insert into users table
INSERT INTO public.users (id, email, public_id, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  generate_public_id() as public_id,
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

## Solution 3: Code-Level Fix (Already Implemented)

The code now:
- Auto-creates profile in GET route if missing
- Handles missing users gracefully
- Generates `public_id` automatically

But the database trigger is still recommended for automatic creation.

## Testing

### Test New Signup:
1. Create a new account on your site
2. Check Supabase → Table Editor → users
3. You should see a new row with the user's email and a `public_id`

### Test Existing User:
1. Go to `/connections` page
2. The API will auto-create the profile if missing
3. Check browser console for: `🔧 User profile does not exist, creating one...`
4. Check Supabase to verify the row was created

## Troubleshooting

### Error: "function generate_public_id() does not exist"
→ Run `backend/add_public_id.sql` first to create the function

### Error: "permission denied"
→ Make sure the function has `SECURITY DEFINER` (already included in the SQL)

### Trigger not firing
→ Check Supabase logs for trigger execution errors
→ Verify the trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`

### Still not working
→ Check Vercel function logs for `/api/users/profile`
→ Look for errors when GET route tries to create profile
→ Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel

## Quick Check Query

Run this to see the current state:

```sql
-- Count auth users vs profile users
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM public.users) as profile_users,
  (SELECT COUNT(*) FROM auth.users au 
   LEFT JOIN public.users u ON au.id = u.id 
   WHERE u.id IS NULL) as missing_profiles;
```

All three numbers should match after running the migration!

