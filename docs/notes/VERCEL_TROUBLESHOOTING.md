# Vercel Troubleshooting Guide

## 🔍 Common Issues and Solutions

### Issue: Profile API Returns 500 Error

**Symptoms:**
- `/api/users/profile` returns 500 status
- Connection ID doesn't show up
- Dashboard/profile pages fail to load

**Causes & Solutions:**

#### 1. Missing Environment Variables

**Check:** Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  ← CRITICAL!
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_API_URL=your_backend_url
```

**Fix:**
1. Verify all variables are set (especially `SUPABASE_SERVICE_ROLE_KEY`)
2. Make sure they're set for **Production** environment
3. **Redeploy** after adding variables (Vercel → Deployments → Redeploy)

#### 2. Database Schema Not Updated

**Check:** Run the public_id migration in Supabase

**Fix:**
1. Go to Supabase Dashboard → SQL Editor
2. Run the contents of `backend/add_public_id.sql`
3. This creates the `public_id` column and trigger

#### 3. User Profile Doesn't Exist

**Check:** The user might not have completed profile setup

**Fix:**
- The API now handles this gracefully and returns a default structure
- User should complete profile setup at `/profile/setup`

---

## 🐛 Debugging Steps

### Step 1: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → **Functions** tab
2. Click on a failed function (e.g., `/api/users/profile`)
3. Check the logs for error messages

**Look for:**
- `Missing Supabase credentials` → Environment variable issue
- `Invalid token` → Authentication issue
- `PGRST116` → User doesn't exist in database

### Step 2: Verify Environment Variables

In Vercel logs, you should see:
- ✅ No errors about missing credentials
- ✅ Successful Supabase connections

If you see:
- ❌ `Missing Supabase credentials` → Add `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Test API Routes Directly

Use curl or Postman to test:

```bash
# Get your auth token from browser DevTools → Application → Cookies
# Or use Supabase client to get session token

curl https://your-app.vercel.app/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "id": "...",
  "email": "...",
  "public_id": "ABCD1234",
  ...
}
```

**If 500 Error:**
- Check Vercel function logs
- Verify environment variables
- Check Supabase connection

---

## ✅ Quick Checklist

Before reporting issues, verify:

- [ ] All environment variables set in Vercel
- [ ] Variables set for **Production** environment
- [ ] Redeployed after adding variables
- [ ] Database schema updated (public_id column exists)
- [ ] User has completed profile setup
- [ ] Checked Vercel function logs for errors

---

## 🔧 Common Fixes

### Fix: Connection ID Not Showing

1. **Check if user has public_id:**
   - Go to Supabase Dashboard → Table Editor → users
   - Find your user and check `public_id` column
   - If NULL, update profile to generate one

2. **Check API response:**
   - Open browser DevTools → Network tab
   - Go to `/connections` page
   - Check `/api/users/profile` response
   - Should include `public_id` field

3. **Regenerate public_id:**
   - Update your profile (go to `/profile`)
   - This will auto-generate `public_id` if missing

### Fix: 500 Errors on Profile API

1. **Add missing environment variable:**
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Redeploy:**
   - Vercel → Deployments → Click "..." → Redeploy

3. **Check logs:**
   - Vercel → Functions → `/api/users/profile` → View logs

---

## 📞 Still Having Issues?

1. **Check Vercel Logs** - Most errors are logged there
2. **Check Supabase Logs** - Database errors appear there
3. **Verify Environment Variables** - Double-check all are set
4. **Test Locally** - If it works locally but not on Vercel, it's an env var issue

---

## 🎯 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | **Critical for API routes** |
| `GEMINI_API_KEY` | ✅ Yes | For AI features |
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Backend API URL |
| `GOOGLE_MAPS_API_KEY` | ⚠️ Optional | For travel data |
| `AMADEUS_CLIENT_ID` | ⚠️ Optional | For flight data |
| `AMADEUS_CLIENT_SECRET` | ⚠️ Optional | For flight data |

**Note:** Variables starting with `NEXT_PUBLIC_` are exposed to the browser. Others are server-only.

