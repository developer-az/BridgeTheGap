# Bridge The Gap - Quick Setup Guide

Follow these steps to get the app running on your local machine.

## Step 1: Create Supabase Project (5 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Name**: Bridge The Gap
   - **Database Password**: (choose a strong password)
   - **Region**: (choose closest to you)
4. Wait for project to initialize (~2 minutes)

## Step 2: Set Up Database (2 minutes)

1. In your Supabase dashboard, click **SQL Editor** in the sidebar
2. Open the file `backend/database_schema.sql` from this project
3. Copy the entire contents
4. Paste into Supabase SQL Editor
5. Click **Run** to create all tables and security policies

## Step 3: Get Supabase Credentials (1 minute)

1. In Supabase dashboard, go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys" - click to reveal)

## Step 4: Configure Frontend (2 minutes)

1. Go to the `frontend-web` folder
2. Create a file named `.env.local`
3. Add this content (replace with your values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Step 5: Configure Backend (2 minutes)

1. Go to the `backend` folder
2. Create a file named `.env`
3. Add this content (replace with your values):

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: Leave these empty for now (app will use mock data)
AMADEUS_CLIENT_ID=
AMADEUS_CLIENT_SECRET=
GOOGLE_MAPS_API_KEY=
```

## Step 6: Install Dependencies (3 minutes)

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm install
```

**Terminal 2 - Frontend:**
```bash
cd frontend-web
npm install
```

## Step 7: Start the Application (1 minute)

Keep both terminals open:

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```
✅ You should see: "🚀 Server running on http://localhost:3001"

**Note:** If you see Supabase warnings, that's OK! The server will still start. You just need to complete Steps 1-5 above to enable database features. The travel search will work with mock data in the meantime.

**Terminal 2 - Start Frontend:**
```bash
cd frontend-web
npm run dev
```
✅ You should see: "Ready on http://localhost:3000"

## Step 8: Create Your First Account (2 minutes)

1. Open browser to **http://localhost:3000**
2. Click **"Sign Up"**
3. Enter your email and password (min 6 characters)
4. Click **"Create Account"**
5. Fill in your profile:
   - University: e.g., "Boston University"
   - Major: e.g., "Computer Science"
   - City: e.g., "Boston"
   - State: e.g., "MA"
   - Bio: (optional)
6. Click **"Continue to Dashboard"**

🎉 **You're all set!** Your app is now running.

## What to Try First

### 1. Add Your Class Schedule
- Click **"Schedule"** from dashboard
- Click **"Add Entry"**
- Add your classes for the week

### 2. Search for Travel Options
- Click **"Travel Plans"**
- Enter origin and destination cities
- Pick a date
- Select travel modes (flight, train, bus)
- Click **"Search Travel Options"**
- Note: Without API keys, you'll see mock data

### 3. Find Partners (Optional)
- Create a second account in an incognito window
- Use a different email (e.g., your-name+2@gmail.com)
- Fill in a different university
- From first account, click **"Find Partners"**
- Search for the university name
- Click **"Connect"**
- Switch to second account and accept the connection

## Troubleshooting

### "Failed to fetch profile" Error
- ✅ Check that backend is running on port 3001
- ✅ Check your `.env` files have correct Supabase credentials
- ✅ Make sure you ran the database_schema.sql in Supabase

### "No token provided" Error
- ✅ Try logging out and logging back in
- ✅ Clear browser cookies for localhost:3000
- ✅ Check browser console (F12) for errors

### Backend won't start
- ✅ Make sure port 3001 is not in use
- ✅ Run `npm install` again in backend folder
- ✅ Check backend/.env file exists with correct values

### Frontend won't start
- ✅ Make sure port 3000 is not in use
- ✅ Run `npm install` again in frontend-web folder
- ✅ Check frontend-web/.env.local file exists

## Next Steps

### Get Real Travel Data (Optional)

**For Flight Data:**
1. Sign up at [developers.amadeus.com](https://developers.amadeus.com)
2. Create a "Self-Service" app
3. Copy Client ID and Secret
4. Add to `backend/.env`:
   ```env
   AMADEUS_CLIENT_ID=your_client_id
   AMADEUS_CLIENT_SECRET=your_client_secret
   ```
5. Restart backend server

**For Train/Bus Data:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable "Directions API"
4. Create API key
5. Add to `backend/.env`:
   ```env
   GOOGLE_MAPS_API_KEY=your_api_key
   ```
6. Restart backend server

## Getting Help

- **Database Issues**: Check Supabase Dashboard > Logs
- **API Errors**: Check backend terminal for error messages
- **UI Issues**: Check browser console (press F12)
- **Auth Problems**: Try clearing cookies and logging in again

## Summary

✅ **Total Setup Time**: ~18 minutes  
✅ **Backend**: Running on http://localhost:3001  
✅ **Frontend**: Running on http://localhost:3000  
✅ **Database**: Supabase with all tables created  
✅ **Features**: All core features working with mock travel data

Enjoy using Bridge The Gap! 🌉

