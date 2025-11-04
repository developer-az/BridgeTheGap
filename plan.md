# Long Distance Relationship Bridge App - Implementation Plan

## Architecture Overview

**Tech Stack (Free & Scalable):**

- **Frontend Web**: Next.js 14 (React) with TypeScript - deployable on Vercel (free tier)
- **Frontend Mobile**: React Native with Expo - free development and deployment
- **Backend**: Node.js with Express & TypeScript
- **Database**: PostgreSQL with Supabase (free tier: 500MB, 50K monthly active users)
- **Authentication**: Supabase Auth (free tier includes email/password)
- **Travel APIs**: Aggregate multiple free-tier APIs (Amadeus, Google Maps/Directions, Amtrak if available)
- **Hosting**: Vercel (frontend) + Railway/Render (backend) - both have free tiers

## Core Features

### 1. User Profiles & Authentication

- University email + password authentication via Supabase Auth
- Profile creation with university name, major, location
- Profile display showing partner's university and major
- Connection system to link two users together

### 2. Class Schedule Management

- Manual schedule entry interface (day/time blocks)
- Schedule display showing both users' availability
- Visual calendar overlay to identify mutual free time
- Basic schedule editing and management

### 3. Travel Planning & Comparison

- Origin/destination input (auto-complete with university locations)
- Multi-API aggregation:
  - **Flights**: Amadeus API (free tier)
  - **Trains**: Amtrak API or Google Directions API for train routes
  - **Buses**: Google Directions API or Greyhound/other providers
- Side-by-side comparison view (price, duration, dates)
- Save favorite routes and travel plans

### 4. Connection & Matching

- User search/discovery by university
- Connection request system
- Partner profile view showing their schedule and travel preferences

## File Structure

```
/
├── frontend-web/          # Next.js web application
│   ├── app/              # Next.js 14 app directory
│   │   ├── (auth)/      # Auth pages (login, signup)
│   │   ├── dashboard/   # Main app dashboard
│   │   ├── profile/     # Profile management
│   │   ├── schedule/    # Schedule management
│   │   └── travel/      # Travel planning
│   ├── components/      # Reusable React components
│   ├── lib/             # Utilities, API client
│   └── types/           # TypeScript types
│
├── frontend-mobile/      # React Native with Expo
│   ├── app/             # Expo Router screens
│   ├── components/      # Shared mobile components
│   └── services/        # API service layer
│
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── routes/      # API route handlers
│   │   ├── services/    # Business logic
│   │   │   ├── travel/  # Travel API aggregation
│   │   │   └── schedule/ # Schedule management
│   │   ├── models/      # Database models
│   │   └── middleware/  # Auth, validation
│   └── prisma/          # Prisma ORM schema (if using Prisma)
│
└── shared/               # Shared TypeScript types/utilities
    └── types/           # Common type definitions
```

## Database Schema (PostgreSQL)

**Users Table:**

- id (uuid, primary key)
- email (unique, university email)
- university_name
- major
- location (city, state)
- created_at, updated_at

**Connections Table:**

- id (uuid, primary key)
- user1_id (foreign key)
- user2_id (foreign key)
- status (pending, accepted, blocked)
- created_at

**Schedules Table:**

- id (uuid, primary key)
- user_id (foreign key)
- day_of_week (0-6)
- start_time (time)
- end_time (time)
- created_at

**TravelPlans Table:**

- id (uuid, primary key)
- user_id (foreign key)
- origin, destination
- travel_date
- return_date (optional)
- preferred_method (flight, train, bus, any)
- saved_routes (jsonb)
- created_at

## Implementation Steps

1. **Project Setup**

   - Initialize Next.js web app with TypeScript
   - Initialize Expo React Native app
   - Set up Node.js/Express backend with TypeScript
   - Configure Supabase project and database
   - Set up shared types package

2. **Authentication System**

   - Configure Supabase Auth with email/password
   - Create login/signup pages (web + mobile)
   - Implement protected routes middleware
   - Add session management

3. **User Profiles**

   - Database schema for users and connections
   - Profile creation/editing pages
   - Connection request/acceptance flow
   - Partner profile display

4. **Schedule Management**

   - Database schema for schedules
   - Manual schedule entry UI (weekly calendar grid)
   - Schedule display with both users' availability
   - Availability overlap visualization

5. **Travel Planning**

   - Set up Amadeus API integration (free tier)
   - Integrate Google Directions API for trains/buses
   - Create travel search interface
   - Build route comparison component
   - Implement travel plan saving

6. **Mobile App**

   - Port web components to React Native
   - Implement navigation (Expo Router)
   - Add mobile-specific UI optimizations
   - Test on iOS/Android simulators

7. **Polish & Deployment**

   - Error handling and loading states
   - Responsive design refinements
   - Deploy backend to Railway/Render
   - Deploy web to Vercel
   - Configure Expo app builds

## Key Files to Create

**Backend:**

- `backend/src/routes/travel.ts` - Travel search aggregation endpoint
- `backend/src/services/travel/amadeusService.ts` - Amadeus API client
- `backend/src/services/travel/googleService.ts` - Google Directions client
- `backend/src/routes/schedule.ts` - Schedule CRUD endpoints
- `backend/src/routes/users.ts` - User profile and connection endpoints

**Frontend Web:**

- `frontend-web/app/(auth)/login/page.tsx` - Login page
- `frontend-web/app/dashboard/page.tsx` - Main dashboard
- `frontend-web/app/schedule/page.tsx` - Schedule management
- `frontend-web/app/travel/page.tsx` - Travel planning
- `frontend-web/components/ScheduleCalendar.tsx` - Calendar component
- `frontend-web/components/TravelComparison.tsx` - Route comparison

**Frontend Mobile:**

- `frontend-mobile/app/(auth)/login.tsx` - Mobile login
- `frontend-mobile/app/(tabs)/dashboard.tsx` - Tab navigation
- `frontend-mobile/components/ScheduleView.tsx` - Mobile schedule

## APIs to Integrate

1. **Amadeus API** (Flights) - Free tier: 2000 calls/month

   - Self-Service API, requires registration
   - Endpoint: `/v2/shopping/flight-offers`

2. **Google Maps Platform** (Trains/Buses/Directions)

   - Free tier: $200/month credit
   - Directions API for multi-modal routes
   - Places API for location autocomplete

3. **Amtrak API** (if available)

   - May require web scraping or alternative approach if no public API

## Environment Variables Needed

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `AMADEUS_CLIENT_ID` - Amadeus API credentials
- `AMADEUS_CLIENT_SECRET` - Amadeus API credentials
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `DATABASE_URL` - PostgreSQL connection string (from Supabase)

## Next Steps After MVP

- University email verification
- Calendar import (iCal, Google Calendar)
- Real-time notifications
- Chat/messaging between partners
- Travel cost splitting calculator
- Integration with more travel providers