# 🔧 Fix: Missing SUPABASE_SERVICE_ROLE_KEY

## Problem
Your frontend API routes are returning 500 errors because `SUPABASE_SERVICE_ROLE_KEY` is missing from `frontend-web/.env.local`.

## Solution

### Step 1: Get Your Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Under "Project API keys", find the **`service_role`** key
5. Click to reveal it (it's secret, so it's hidden by default)
6. Copy the entire key

### Step 2: Add to Frontend .env.local

Open `frontend-web/.env.local` and add this line:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Your complete `.env.local` should look like:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://thoknyxumbhofmfwzulu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Step 3: Restart Your Dev Server

After adding the key:

1. Stop your frontend server (Ctrl+C in the frontend terminal)
2. Restart it:
   ```bash
   cd frontend-web
   npm run dev
   ```

Or use the stop/start scripts:
```powershell
.\stop-app.ps1
.\start-app.ps1
```

## Why This Is Needed

The Next.js API routes (`/api/users/profile`, `/api/connections`, etc.) run on the **server side** and need the `service_role` key to:
- Authenticate API requests
- Access the database with admin privileges
- Verify user tokens

The `anon` key is for client-side operations, but server-side routes need the `service_role` key.

## Security Note

⚠️ **Never commit `.env.local` to git!** It's already protected by `.gitignore`.

The `service_role` key has admin access - keep it secret!

## After Fixing

Once you add the key and restart:
- ✅ API routes will work
- ✅ Dashboard will load
- ✅ Profile and connections will work
- ✅ No more 500 errors!

---

**Quick Fix:** Copy the `SUPABASE_SERVICE_ROLE_KEY` from your `backend/.env` file (if you have it there) and add it to `frontend-web/.env.local`.


