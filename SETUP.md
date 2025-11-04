# Quick Setup Guide

Follow these steps to get Bridge The Gap running locally.

## Step 1: Database Setup (5 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (remember your database password)
3. Once the project is ready, go to **SQL Editor** in the left sidebar
4. Copy the entire contents of `backend/database/schema.sql`
5. Paste it into the SQL Editor and click **Run**
6. You should see "Success. No rows returned" - this means your tables were created!

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, click **Project Settings** (gear icon)
2. Go to **API** section
3. Copy these two values:
   - `Project URL` (looks like: https://xxxxx.supabase.co)
   - `anon public` key (under "Project API keys")

## Step 3: Backend Setup (2 minutes)

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file
# On Windows (PowerShell):
@"
PORT=3001
SUPABASE_URL=your_project_url_from_step2
SUPABASE_ANON_KEY=your_anon_key_from_step2
"@ | Out-File -FilePath .env -Encoding utf8

# On Mac/Linux:
# cat > .env << EOL
# PORT=3001
# SUPABASE_URL=your_project_url_from_step2
# SUPABASE_ANON_KEY=your_anon_key_from_step2
# EOL

# Start the backend server
npm run dev
```

You should see: `🚀 Server running on http://localhost:3001`

## Step 4: Frontend Setup (2 minutes)

Open a **new terminal window** and:

```bash
# Navigate to frontend folder
cd frontend-web

# Install dependencies
npm install

# Create .env.local file
# On Windows (PowerShell):
@"
NEXT_PUBLIC_SUPABASE_URL=your_project_url_from_step2
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_step2
NEXT_PUBLIC_API_URL=http://localhost:3001
"@ | Out-File -FilePath .env.local -Encoding utf8

# On Mac/Linux:
# cat > .env.local << EOL
# NEXT_PUBLIC_SUPABASE_URL=your_project_url_from_step2
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_step2
# NEXT_PUBLIC_API_URL=http://localhost:3001
# EOL

# Start the frontend
npm run dev
```

You should see: `✓ Ready on http://localhost:3000`

## Step 5: Use the App!

1. Open your browser to `http://localhost:3000`
2. Click "Sign Up" to create an account
3. Fill in your profile (university, major, location)
4. Explore the features:
   - Add your class schedule
   - Search for partners
   - Plan travel routes

## Optional: Travel API Keys

By default, the app uses **mock data** for travel searches. To get real flight/train/bus data:

### For Real Flight Data (Amadeus API)
1. Go to [developers.amadeus.com](https://developers.amadeus.com)
2. Create a free account
3. Get your API key and secret
4. Add to `backend/.env`:
```
AMADEUS_CLIENT_ID=your_client_id
AMADEUS_CLIENT_SECRET=your_client_secret
```

### For Real Transit Data (Google Maps)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable "Directions API"
3. Create an API key
4. Add to `backend/.env`:
```
GOOGLE_MAPS_API_KEY=your_api_key
```

## Troubleshooting

### "Cannot find module" errors
```bash
# Make sure you ran npm install in both folders
cd backend && npm install
cd ../frontend-web && npm install
```

### "Connection refused" on frontend
- Make sure the backend is running on port 3001
- Check that `NEXT_PUBLIC_API_URL` in `.env.local` is correct

### "Invalid API key" from Supabase
- Double-check you copied the **anon public** key, not the service role key
- Make sure there are no extra spaces in your `.env` files

### Database errors
- Re-run the SQL schema from `backend/database/schema.sql`
- Check that your Supabase project is active

## What's Next?

1. Create your profile
2. Add your class schedule
3. Test the travel search (will use mock data without API keys)
4. Invite a friend to test the connection features!

Need help? Check the full README.md for more details.

