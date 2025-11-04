# Bridge The Gap 🌉

A comprehensive platform for bridging the gap in long-distance relationships, especially for students at different universities. Find travel options (flights, trains, buses), manage schedules, and stay connected with your partner.

## Features

### ✨ Core Functionality

- **User Profiles** - University name, major, location, and bio
- **Connection System** - Find and connect with partners at other universities
- **Class Schedule Management** - Weekly calendar for classes and commitments
- **Mutual Availability** - See when both you and your partner are free
- **Multi-Modal Travel Search** - Compare flights, trains, and buses
- **Saved Travel Plans** - Save and revisit your favorite routes

### 🎓 Perfect For

- Long-distance relationships between students
- Internships and research opportunities
- Planning visits between universities
- Coordinating schedules across time zones

## Tech Stack

### Frontend
- **Next.js 16** with App Router
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **Supabase Client** for authentication

### Backend
- **Node.js** with **Express**
- **TypeScript** for type safety
- **Supabase** for database & auth
- **Amadeus API** for flight data
- **Google Maps API** for trains/buses

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works great!)
- Optional: Amadeus and Google Maps API keys for real travel data

### 1. Clone and Install

```bash
# Install frontend dependencies
cd frontend-web
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `backend/database_schema.sql`
3. Get your project URL and keys from Settings > API

### 3. Configure Environment Variables

**Frontend** (`frontend-web/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Backend** (`backend/.env`):
```env
PORT=3001
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: For real travel data
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 4. Run the Application

```bash
# Terminal 1: Start the backend
cd backend
npm run dev
# Backend runs on http://localhost:3001

# Terminal 2: Start the frontend
cd frontend-web
npm run dev
# Frontend runs on http://localhost:3000
```

### 5. Create Your First Account

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Enter your university email and password
4. Complete your profile with university info
5. Start connecting!

## Project Structure

```
BridgeTheGap/
├── frontend-web/              # Next.js frontend
│   ├── app/
│   │   ├── (auth)/           # Login & signup pages
│   │   ├── dashboard/        # Main dashboard
│   │   ├── profile/          # Profile management
│   │   ├── schedule/         # Schedule calendar
│   │   ├── travel/           # Travel search
│   │   └── connections/      # Find partners
│   ├── components/           # Reusable React components
│   ├── lib/                  # Supabase client & API
│   └── types/                # TypeScript definitions
│
├── backend/                   # Express API server
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth middleware
│   │   └── config/           # Configuration
│   └── database_schema.sql   # Database setup
│
└── plan.md                    # Development plan
```

## Database Schema

The app uses Supabase (PostgreSQL) with the following tables:

- **users** - User profiles with university and major
- **connections** - Partner relationships between users
- **schedules** - Weekly class/work schedules
- **travel_plans** - Saved travel search results

All tables have Row Level Security (RLS) policies for data protection.

## API Endpoints

### Users
- `GET /api/users/profile` - Current user profile
- `POST /api/users/profile` - Update profile
- `GET /api/users/search` - Find other users

### Connections
- `GET /api/connections` - Get all connections
- `POST /api/connections/request` - Request connection
- `PUT /api/connections/:id/accept` - Accept connection

### Schedule
- `GET /api/schedule` - Get your schedule
- `POST /api/schedule` - Add schedule entry
- `GET /api/schedule/mutual/:partnerId` - Mutual availability

### Travel
- `POST /api/travel/search` - Search travel options
- `GET /api/travel/plans` - Get saved plans
- `POST /api/travel/plans` - Save a travel plan

## Travel APIs (Optional)

### Amadeus API (Flights)
1. Sign up at [developers.amadeus.com](https://developers.amadeus.com)
2. Create a test app
3. Add Client ID and Secret to backend `.env`
4. Free tier: 2000 API calls/month

### Google Maps Directions API (Trains/Buses)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Directions API
3. Create API key
4. Add to backend `.env`
5. Free tier: $200/month credit

**Note:** The app includes mock data, so you can test without API keys!

## Development Tips

### Working with Supabase

```bash
# View logs in Supabase Dashboard > Logs
# Test RLS policies in SQL Editor
# Monitor API usage in Settings > Usage
```

### Adding New Features

1. Add database tables in `database_schema.sql`
2. Create API routes in `backend/src/routes/`
3. Update API client in `frontend-web/lib/api.ts`
4. Add TypeScript types in `frontend-web/types/index.ts`
5. Create UI pages in `frontend-web/app/`

### Debugging

- Backend logs: Check the terminal running `npm run dev`
- Frontend errors: Check browser console (F12)
- Database queries: Supabase Dashboard > Logs > Postgres Logs
- Auth issues: Supabase Dashboard > Authentication > Users

## Deployment

### Frontend (Vercel)
```bash
cd frontend-web
vercel
```

### Backend (Railway/Render)
```bash
cd backend
# Push to GitHub, then connect in Railway/Render dashboard
```

### Environment Variables
Don't forget to add all env vars to your deployment platforms!

## Future Enhancements

- [ ] Calendar import (Google Calendar, iCal)
- [ ] Real-time chat between partners
- [ ] Push notifications for travel deals
- [ ] Travel cost splitting calculator
- [ ] Mobile app with React Native
- [ ] University email verification
- [ ] Shared photo albums
- [ ] Visit countdown timer

## Contributing

This is a personal project built to help students in long-distance relationships. Feel free to fork and customize for your needs!

## License

MIT License - Feel free to use and modify as needed.

## Support

For questions about:
- **Setup issues**: Check the README steps carefully
- **Supabase**: Visit [supabase.com/docs](https://supabase.com/docs)
- **Travel APIs**: Check Amadeus and Google Maps documentation

---

Built with ❤️ for students navigating long-distance relationships
