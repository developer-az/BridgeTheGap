# Bridge The Gap - Quick Start Without Supabase

Want to test the app immediately without setting up Supabase? Here's how!

## Option 1: Test Travel Search Only (2 minutes)

If you just want to see the travel search feature working with mock data:

### 1. Start Backend
```bash
cd backend
npm run dev
```

**You'll see warnings about Supabase** - that's OK! The server will still start and serve mock travel data.

### 2. Start Frontend  
```bash
cd frontend-web
npm run dev
```

### 3. Test Travel Search
- Go to http://localhost:3000/travel (you'll be redirected to login, but the server is working)
- The travel API will serve mock data for testing

## Option 2: Full App Setup (18 minutes)

For the complete experience with user accounts, profiles, schedules, and connections:

**Follow the full SETUP_GUIDE.md** which includes:
1. Creating a Supabase account (free)
2. Setting up the database
3. Configuring environment variables
4. Starting both servers
5. Creating your first account

## What Works Without Supabase?

### ✅ Works (Mock Data)
- Backend server starts
- Travel search API (flights, trains, buses)
- API endpoints respond

### ❌ Doesn't Work (Needs Database)
- User authentication
- Creating accounts
- Saving profiles
- Managing schedules
- Creating connections
- Saving travel plans

## Current Backend Status

If you just started the backend and see:

```
⚠️  Supabase credentials not configured. Database features will not work.
📝 To fix: Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env
📖 See SETUP_GUIDE.md for instructions

🚀 Server running on http://localhost:3001
```

**This is NORMAL!** The server is running and ready. You just need to:

1. Follow Steps 1-5 in SETUP_GUIDE.md to set up Supabase
2. Restart the backend server
3. Create your first account

## Testing the Backend API

You can test the travel search endpoint directly:

```bash
# In a new terminal
curl -X POST http://localhost:3001/api/travel/search \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Boston",
    "destination": "New York",
    "date": "2024-12-01",
    "modes": ["flight", "train", "bus"]
  }'
```

You'll get mock travel data back!

## Next Steps

**Ready for the full experience?** 

👉 Follow **SETUP_GUIDE.md** to set up Supabase and unlock all features!

It only takes 18 minutes total, and 13 of those are following simple setup steps. You'll have a fully functional app with user accounts, profiles, schedules, and real connections.

## Need Help?

- **"Supabase warnings are showing"** - This is normal! Follow SETUP_GUIDE.md to configure it.
- **"Server won't start at all"** - Check that port 3001 isn't in use, and you ran `npm install`
- **"Frontend won't start"** - Check that port 3000 isn't in use, and you ran `npm install` in frontend-web

---

**Bottom Line:** The backend now starts successfully even without Supabase! It will show warnings and database features won't work, but the server runs and serves mock travel data. To get the full app working, follow SETUP_GUIDE.md to set up Supabase (18 minutes total).



