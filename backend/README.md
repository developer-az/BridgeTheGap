# Bridge The Gap - Backend API

Backend API server for the Bridge The Gap long-distance relationship app.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=3001
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: Travel APIs for real data
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Set Up Supabase Database

1. Go to your Supabase project at https://supabase.com
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database_schema.sql`
4. Run the SQL to create all tables and policies

### 4. Get API Keys (Optional)

**For Real Flight Data (Amadeus API):**
- Sign up at https://developers.amadeus.com
- Create a new app to get your Client ID and Secret
- Use the test environment for development

**For Real Train/Bus Data (Google Maps API):**
- Go to https://console.cloud.google.com
- Enable the Directions API
- Create an API key

**Note:** The app includes mock data, so you can test without API keys.

## Running the Server

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3001` with hot-reloading.

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Authentication
All endpoints require a Bearer token from Supabase auth in the Authorization header.

### Users
- `GET /api/users/profile` - Get current user profile
- `POST /api/users/profile` - Update user profile
- `GET /api/users/search?university=name` - Search for users
- `GET /api/users/:id` - Get specific user

### Connections
- `GET /api/connections` - Get all connections
- `POST /api/connections/request` - Request a connection
- `PUT /api/connections/:id/accept` - Accept a connection
- `DELETE /api/connections/:id` - Delete a connection

### Schedule
- `GET /api/schedule` - Get current user's schedule
- `GET /api/schedule/user/:userId` - Get another user's schedule
- `GET /api/schedule/mutual/:partnerId` - Get mutual availability
- `POST /api/schedule` - Create schedule entry
- `PUT /api/schedule/:id` - Update schedule entry
- `DELETE /api/schedule/:id` - Delete schedule entry

### Travel
- `POST /api/travel/search` - Search travel options (flights, trains, buses)
- `GET /api/travel/plans` - Get saved travel plans
- `POST /api/travel/plans` - Save a travel plan
- `DELETE /api/travel/plans/:id` - Delete a travel plan

## Tech Stack

- **Node.js** with **Express**
- **TypeScript** for type safety
- **Supabase** for database and authentication
- **Amadeus API** for flight data
- **Google Maps Directions API** for train/bus data

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Supabase client configuration
│   ├── middleware/
│   │   └── auth.ts              # Authentication middleware
│   ├── routes/
│   │   ├── users.ts             # User profile endpoints
│   │   ├── connections.ts       # Connection management
│   │   ├── schedule.ts          # Schedule management
│   │   └── travel.ts            # Travel search
│   ├── services/
│   │   └── travel/
│   │       ├── amadeusService.ts    # Flight API integration
│   │       └── googleService.ts     # Ground transport API
│   └── server.ts                # Main server file
├── database_schema.sql          # Database setup
└── package.json
```
