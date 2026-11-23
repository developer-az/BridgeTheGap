# Vercel Deployment Guide

## 🚀 Quick Setup for Vercel

This guide covers all environment variables needed for deploying Bridge The Gap to Vercel.

## Required Environment Variables

Add these in your Vercel project settings (Settings → Environment Variables):

### Public Variables (Available in Browser)
These variables are prefixed with `NEXT_PUBLIC_` and are exposed to the client:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_API_URL=https://your-backend-api-url.com
```

**Note:** For `NEXT_PUBLIC_API_URL`, use your production backend URL. If you're deploying the backend separately, use that URL. For local development, it's `http://localhost:3001`.

### Server-Side Only Variables (API Routes)
These are only available in server-side code (API routes, Server Components):

```
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### Optional Variables (For Enhanced Features)

If you want real travel data instead of mock data:

```
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
```

If you want to use OpenRouter as a fallback (optional):

```
OPENROUTER_API_KEY=your_openrouter_api_key
```

## Step-by-Step Vercel Setup

### 1. Push Code to GitHub
```bash
git add .
git commit -m "Add Gemini API integration and update dependencies"
git push origin main
```

### 2. Import Project in Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Select the **`frontend-web`** folder as the root directory
5. Framework Preset: **Next.js** (auto-detected)

### 3. Configure Build Settings

- **Root Directory:** `frontend-web`
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)

### 4. Add Environment Variables

1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Add each variable listed above
3. Select environments: **Production**, **Preview**, and **Development** (or just Production)
4. Click **Save**

### 5. Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## Environment Variable Reference

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | ✅ Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | ✅ Yes | Supabase anonymous/public key |
| `NEXT_PUBLIC_API_URL` | Public | ✅ Yes | Backend API URL (production) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | ✅ Yes | Supabase service role key (for API routes) |
| `GEMINI_API_KEY` | Server | ✅ Yes | Google Gemini API key (for AI schedule parsing) |
| `GOOGLE_MAPS_API_KEY` | Server | ⚠️ Optional | For real train/bus data |
| `AMADEUS_CLIENT_ID` | Server | ⚠️ Optional | For real flight data |
| `AMADEUS_CLIENT_SECRET` | Server | ⚠️ Optional | For real flight data |
| `OPENROUTER_API_KEY` | Server | ⚠️ Optional | Fallback AI provider |

## Getting Your API Keys

### Supabase Keys
1. Go to your Supabase project dashboard
2. Settings → API
3. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app)
2. Sign in with Google account
3. Click **"Get API Key"** → **"Create API Key"**
4. Copy the key (starts with `AIza...`) → `GEMINI_API_KEY`

### Backend API URL
- If deploying backend separately: Use that URL
- If using a backend service: Use that URL
- For local testing: `http://localhost:3001` (not for production!)

## Troubleshooting

### Build Fails
- Check that all required environment variables are set
- Verify `NEXT_PUBLIC_API_URL` points to a valid backend
- Check build logs in Vercel dashboard

### API Errors in Production
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check that `GEMINI_API_KEY` is valid
- Ensure backend CORS allows your Vercel domain

### Schedule Parsing Not Working
- Verify `GEMINI_API_KEY` is set in Vercel
- Check API key is valid at [Google AI Studio](https://makersuite.google.com/app)
- Check Vercel function logs for errors

## Post-Deployment Checklist

- [ ] All environment variables added to Vercel
- [ ] Backend API is accessible from Vercel domain
- [ ] CORS configured on backend to allow Vercel domain
- [ ] Test schedule parsing feature
- [ ] Test user authentication
- [ ] Test travel search (works with mock data if APIs not configured)

## Updating Environment Variables

1. Go to Vercel project → **Settings** → **Environment Variables**
2. Edit or add variables as needed
3. **Redeploy** the project (or wait for next deployment)
4. Changes take effect immediately after redeploy

---

**Need Help?** Check the main README.md or GEMINI_SETUP.md for more details.

