# Vercel Environment Variables - Quick Reference

## ⚡ Copy-Paste Ready for Vercel Dashboard

Go to: **Vercel Project → Settings → Environment Variables**

Add these variables (one at a time):

### Required Variables

```
NEXT_PUBLIC_SUPABASE_URL
```
*(Your Supabase project URL: https://xxxxx.supabase.co)*

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
*(Your Supabase anon/public key)*

```
NEXT_PUBLIC_API_URL
```
*(Your production backend URL, e.g., https://your-backend.vercel.app or https://api.yourdomain.com)*

```
SUPABASE_SERVICE_ROLE_KEY
```
*(Your Supabase service_role key - keep this secret!)*

```
GEMINI_API_KEY
```
*(Your Google Gemini API key from https://makersuite.google.com/app)*

### Optional Variables (For Real Travel Data)

```
GOOGLE_MAPS_API_KEY
```
*(For real train/bus data)*

```
AMADEUS_CLIENT_ID
```
*(For real flight data)*

```
AMADEUS_CLIENT_SECRET
```
*(For real flight data)*

---

## 🎯 Quick Setup Steps

1. **Push code** ✅ (Already done!)
2. **Import project in Vercel** (if not already done)
   - Go to vercel.com → Add New Project
   - Import from GitHub
   - Root Directory: `frontend-web`
3. **Add environment variables** (use list above)
4. **Deploy** → Done!

---

## 📋 Checklist

- [ ] All 5 required variables added
- [ ] `NEXT_PUBLIC_API_URL` points to production backend
- [ ] Variables set for Production environment
- [ ] Deployed and tested

---

**Full guide:** See `VERCEL_DEPLOYMENT.md` for detailed instructions.

