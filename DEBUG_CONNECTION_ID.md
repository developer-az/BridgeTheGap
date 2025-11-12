# Debugging Connection ID Not Showing

## Quick Debug Steps

### Step 1: Check Browser Console

1. Open your Vercel site
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Look for errors related to `/api/users/profile`

**What to look for:**
- ❌ `Failed to fetch profile (500)` → API error
- ❌ `Server configuration error` → Missing environment variables
- ❌ `Invalid token` → Authentication issue
- ✅ No errors → Check Network tab

### Step 2: Check Network Tab

1. In DevTools, go to **Network** tab
2. Refresh the page
3. Find the request to `/api/users/profile`
4. Click on it to see details

**Check the Response:**
- **Status:** Should be `200` (not `500`)
- **Response body:** Should include `public_id` field

**If status is 500:**
- Click on the request → **Response** tab
- Look for error message
- Common errors:
  - `Missing Supabase credentials` → Add `SUPABASE_SERVICE_ROLE_KEY` in Vercel
  - `Invalid token` → Log out and log back in

### Step 3: Check Vercel Logs

1. Go to Vercel Dashboard
2. Your Project → **Functions** tab
3. Click on `/api/users/profile`
4. Check the **Logs** section

**Look for:**
- `🔧 Generating public_id for user:` → ID is being generated
- `✅ Generated public_id: ABCD1234` → Success!
- `❌ Missing Supabase credentials` → Environment variable issue
- `❌ Supabase query error` → Database issue

### Step 4: Verify Environment Variables

In Vercel Dashboard → Settings → Environment Variables, verify:

```
✅ NEXT_PUBLIC_SUPABASE_URL=your_url
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
✅ SUPABASE_SERVICE_ROLE_KEY=your_service_key  ← CRITICAL!
✅ GEMINI_API_KEY=your_key
✅ NEXT_PUBLIC_API_URL=your_backend_url
```

**Important:** After adding/updating variables:
1. **Redeploy** your project
2. Wait for deployment to complete
3. Clear browser cache and refresh

### Step 5: Test the API Directly

Open browser console and run:

```javascript
// Get your auth token
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Test the API
fetch('/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('Profile data:', data);
  console.log('Public ID:', data.public_id);
})
.catch(err => console.error('Error:', err));
```

**Expected output:**
```json
{
  "id": "...",
  "email": "...",
  "public_id": "ABCD1234",  ← Should be here!
  ...
}
```

## Common Issues & Fixes

### Issue: API Returns 500

**Fix:**
1. Check Vercel logs for specific error
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
3. Redeploy after adding variables

### Issue: public_id is null

**Fix:**
1. The API should auto-generate it now
2. Refresh the page
3. If still null, check Vercel logs for generation errors

### Issue: Connection ID section doesn't show

**Fix:**
1. Check if `currentUser` is set (console.log it)
2. The section should always show now (even with loading state)
3. If completely missing, check React DevTools for component state

### Issue: "Loading..." never changes

**Fix:**
1. Check Network tab - is API being called?
2. Check if API returns `public_id`
3. Check browser console for errors
4. Try refreshing the page

## Still Not Working?

1. **Check Vercel Function Logs** - Most errors are logged there
2. **Verify Database** - Check Supabase dashboard that `public_id` column exists
3. **Test Locally** - Does it work on `localhost:3000`?
4. **Check Authentication** - Are you logged in?

## Quick Test Script

Paste this in browser console on your Vercel site:

```javascript
(async () => {
  try {
    // Import supabase (adjust path if needed)
    const { supabase } = await import('/lib/supabase.js');
    
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('❌ Not logged in:', sessionError);
      return;
    }
    
    console.log('✅ Logged in as:', session.user.email);
    
    // Test profile API
    const res = await fetch('/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await res.json();
    console.log('📊 Profile API Response:', data);
    console.log('🆔 Public ID:', data.public_id || '❌ MISSING!');
    
    if (!data.public_id) {
      console.warn('⚠️ Public ID is missing! Check Vercel logs for generation errors.');
    } else {
      console.log('✅ Public ID found:', data.public_id);
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
})();
```

