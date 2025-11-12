# Google Gemini API Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your API Key

1. Go to **Google AI Studio**: https://makersuite.google.com/app
2. Sign in with your Google account
3. Click **"Get API Key"** in the left sidebar
4. Click **"Create API Key"**
5. Copy your API key (starts with `AIza...`)

### Step 2: Add to Environment File

Add this line to `frontend-web/.env.local`:

```env
GEMINI_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with the key you copied.

### Step 3: Restart Server

```powershell
.\stop-app.ps1
.\start-app.ps1
```

## ✅ That's It!

Your app now uses Google Gemini API with:
- **1,500 requests/day** (vs 50 on OpenRouter)
- **No credit card required**
- **Better reliability**
- **Perfect for schedule parsing**

## 📊 Free Tier Limits

- **15 requests per minute** (RPM)
- **1,500 requests per day** (RPD)
- **No credit card needed**
- **No expiration** (as long as you use it)

## 🔧 Troubleshooting

**Error: "Gemini API key not configured"**
- Make sure `GEMINI_API_KEY` is in `frontend-web/.env.local`
- Restart your server after adding the key

**Error: "Rate limit exceeded"**
- You've hit 15 requests/minute limit
- Wait 1 minute and try again
- Daily limit is 1,500 requests (plenty for testing!)

**Error: "Quota exceeded"**
- You've hit the daily limit of 1,500 requests
- Wait until tomorrow or use the manual form

## 🎯 Benefits Over OpenRouter

| Feature | OpenRouter | Gemini |
|---------|-----------|--------|
| Free Requests/Day | 50 | 1,500 |
| Credit Card | Not needed | Not needed |
| Reliability | Rate limits | More stable |
| Speed | Medium | Fast |
| Setup | Easy | Very Easy |

## 📚 API Documentation

- Official Docs: https://ai.google.dev/docs
- API Reference: https://ai.google.dev/api
- Models: https://ai.google.dev/models

## 💡 Tips

- Use `gemini-1.5-flash` for speed (default)
- Use `gemini-1.5-pro` for better accuracy (if needed)
- The API key is free forever (no expiration)


