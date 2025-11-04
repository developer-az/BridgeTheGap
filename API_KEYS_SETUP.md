# 🔑 API Keys Setup Guide

This guide will help you get **real travel data** (flights, trains, and buses) for Bridge The Gap.

---

## ✈️ Step 1: Amadeus API (Real Flights) - FREE

### What it does:
- Search real flight prices and schedules
- Compare airlines and departure times
- Get actual booking availability

### How to get it:

1. **Sign up for Amadeus for Developers**
   - Visit: https://developers.amadeus.com/register
   - Create a free account

2. **Create an App**
   - Go to "My Apps" → Click "Create New App"
   - Name it: `Bridge The Gap Travel`
   - Select "Flight Offers Search" API

3. **Get Your Credentials**
   - Click on your app
   - Copy the `API Key` (Client ID)
   - Copy the `API Secret` (Client Secret)

4. **Add to your environment**

   **For Local Development:**
   - Open `frontend-web/.env.local` (create it if it doesn't exist)
   - Add:
   ```
   AMADEUS_CLIENT_ID=your_api_key_here
   AMADEUS_CLIENT_SECRET=your_api_secret_here
   ```

   **For Vercel Deployment:**
   - Go to: https://vercel.com/dashboard
   - Open your project → Settings → Environment Variables
   - Add both variables with their values

### Free Tier Limits:
- ✅ 2,000 requests/month
- ✅ Full flight search access
- ✅ Real-time pricing

---

## 🚂 Step 2: Google Maps API (Real Trains & Buses) - FREE

### What it does:
- Search real train and bus schedules
- Show transit routes and stops
- Display accurate travel times

### How to get it:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com

2. **Create a New Project**
   - Click "Select a project" → "New Project"
   - Name it: `BridgeTheGap`
   - Click "Create"

3. **Enable Directions API**
   - Go to: https://console.cloud.google.com/apis/library
   - Search for "Directions API"
   - Click on it → Click "Enable"

4. **Create API Key**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "API Key"
   - Copy your API key

5. **Secure Your API Key (Optional but Recommended)**
   - Click "Edit API key" (pencil icon)
   - Under "API restrictions":
     - Select "Restrict key"
     - Check only "Directions API"
   - Under "Application restrictions":
     - Select "HTTP referrers (websites)"
     - Add your Vercel domain: `*.vercel.app/*`
   - Click "Save"

6. **Add to your environment**

   **For Local Development:**
   - Open `frontend-web/.env.local`
   - Add:
   ```
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

   **For Vercel Deployment:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add the variable

### Free Tier Limits:
- ✅ $200 free credit/month
- ✅ ~40,000 requests/month free
- ✅ No credit card required initially

---

## 📝 Complete Environment Variable Setup

After getting both APIs, your `frontend-web/.env.local` should look like:

```bash
# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Amadeus API (for flights)
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret

# Google Maps API (for trains/buses)
GOOGLE_MAPS_API_KEY=your_google_api_key
```

---

## 🚀 Vercel Deployment - Environment Variables

When deploying to Vercel, add these environment variables:

| Variable Name | Description | Where to Get It |
|--------------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | Supabase Dashboard → Settings → API |
| `AMADEUS_CLIENT_ID` | Amadeus API Key | Amadeus Dashboard → My Apps |
| `AMADEUS_CLIENT_SECRET` | Amadeus API Secret | Amadeus Dashboard → My Apps |
| `GOOGLE_MAPS_API_KEY` | Google Maps API Key | Google Cloud Console → Credentials |

### How to add on Vercel:
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to: **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter the name and value
6. Select **Production**, **Preview**, and **Development**
7. Click **Save**
8. **Redeploy** your app after adding all variables

---

## 🧪 Testing Your Setup

### Without API Keys (Mock Data):
- Travel search will show placeholder flights, trains, and buses
- Console will show: `⚠️ Using mock data - Add API keys to enable real data`

### With API Keys (Real Data):
- You'll see actual flight prices from airlines
- Real train and bus schedules from Google Transit
- Live departure and arrival times

### How to Test:
1. Start your app: `npm run dev` (in `frontend-web` directory)
2. Go to: http://localhost:3000/travel
3. Search for travel: e.g., "Boston, MA" to "New York, NY"
4. Check the browser console:
   - If you see mock data warnings → API keys not loaded
   - If you see API calls → Real data is working! ✅

---

## 🆘 Troubleshooting

### "Using mock flight data" warning:
- **Solution**: Make sure `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET` are in `.env.local`
- Restart your dev server after adding environment variables

### "Using mock train/bus data" warning:
- **Solution**: Make sure `GOOGLE_MAPS_API_KEY` is in `.env.local`
- Restart your dev server

### Google API returns "ZERO_RESULTS":
- This is normal for some city pairs without direct transit
- The app will automatically fall back to mock data

### Amadeus API "Invalid Client" error:
- Double-check your Client ID and Secret are correct
- Make sure you're using the Test Environment credentials

### Vercel deployment not using API keys:
- Make sure you added the variables in Vercel Dashboard
- Redeploy after adding environment variables
- Check the deployment logs for errors

---

## 💡 Pro Tips

1. **Start with one API**: Get Amadeus working first (flights), then add Google Maps
2. **Use Test Mode**: Amadeus has a test environment - your credentials are for testing
3. **Monitor Usage**: Check your API usage in the dashboards to avoid hitting limits
4. **Production vs Test**: When you go live, you'll need to apply for Amadeus production access

---

## 📊 Cost Estimate

### For a typical long-distance couple app:
- **Amadeus**: FREE (under 2,000 searches/month)
- **Google Maps**: FREE (under 40,000 requests/month)
- **Total Cost**: $0/month for most users! 🎉

The free tiers are more than enough for:
- ~65 travel searches per day
- Multiple users searching simultaneously
- Testing and development

---

## ✅ Ready to Go!

Once you've added the API keys:

1. **Restart your development server**
   ```bash
   # Stop the server (Ctrl+C)
   cd frontend-web
   npm run dev
   ```

2. **Test the travel search**
   - Visit http://localhost:3000/travel
   - Try searching for flights between two cities
   - Check if you see real prices!

3. **Deploy to Vercel**
   ```bash
   git add .
   git commit -m "Add real travel API integration"
   git push origin main
   ```

4. **Add environment variables on Vercel** (see above)

5. **Enjoy real travel data!** ✈️🚂🚌

---

## 🤝 Need Help?

- **Amadeus Docs**: https://developers.amadeus.com/self-service
- **Google Maps Docs**: https://developers.google.com/maps/documentation/directions
- **Supabase Docs**: https://supabase.com/docs

Your app will work with mock data until you add the API keys - so you can test everything else first!

