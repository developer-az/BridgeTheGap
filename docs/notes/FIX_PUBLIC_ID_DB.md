# Fix: public_id Column Database Issue

## Problem
Connection ID box shows "Loading..." indefinitely. This usually means:
1. The `public_id` column doesn't exist in your database
2. OR the column exists but has constraints preventing updates

## Solution: Run Database Migration

### Step 1: Check if Column Exists

1. Go to **Supabase Dashboard** → **Table Editor** → **users** table
2. Check if you see a `public_id` column
3. If **NOT**, continue to Step 2

### Step 2: Run the Migration SQL

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open the file `backend/add_public_id.sql` in your code editor
3. **Copy ALL contents** of that file
4. **Paste** into Supabase SQL Editor
5. **Click "Run"**

**Important:** This will:
- Add the `public_id` column
- Generate IDs for existing users
- Create a trigger to auto-generate IDs for new users

### Step 3: Verify It Worked

After running the SQL:

1. Go to **Table Editor** → **users**
2. You should now see `public_id` column
3. Existing users should have IDs like `ABCD1234`

### Step 4: Test on Your Site

1. Refresh your Vercel site
2. Go to `/connections` page
3. The connection ID should appear (not "Loading...")

## Alternative: Manual Fix for Existing Users

If the migration doesn't work or you want to fix specific users:

```sql
-- Generate public_id for a specific user (replace USER_ID)
UPDATE users 
SET public_id = (
  SELECT string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 
           floor(random() * 32 + 1)::int, 1), 
    ''
  )
  FROM generate_series(1, 8)
)
WHERE id = 'USER_ID_HERE' AND public_id IS NULL;
```

## Troubleshooting

### Error: "column public_id does not exist"
→ Run the migration SQL from `backend/add_public_id.sql`

### Error: "violates not-null constraint"
→ The column exists but has NOT NULL constraint. Run:
```sql
ALTER TABLE users ALTER COLUMN public_id DROP NOT NULL;
```
Then run the migration again.

### Error: "duplicate key value violates unique constraint"
→ An ID collision occurred. The migration should handle this, but if it persists:
```sql
-- Check for duplicates
SELECT public_id, COUNT(*) 
FROM users 
GROUP BY public_id 
HAVING COUNT(*) > 1;

-- Regenerate IDs for duplicates
UPDATE users 
SET public_id = NULL 
WHERE public_id IN (
  SELECT public_id 
  FROM users 
  GROUP BY public_id 
  HAVING COUNT(*) > 1
);
```

Then run the migration again.

## Quick Test Query

Run this in Supabase SQL Editor to check your setup:

```sql
-- Check if column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'public_id';

-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_set_public_id';

-- Check users without public_id
SELECT id, email, public_id
FROM users
WHERE public_id IS NULL;
```

**Expected Results:**
- Column should exist with type `text`
- Trigger should exist
- No users should have NULL public_id (after migration)

