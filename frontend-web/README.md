# Bridge The Gap - Frontend Web Application

Next.js web application for the Bridge The Gap long-distance relationship platform.

## Features

- **Authentication**: Sign up and login with Supabase Auth
- **User Profiles**: Create and manage profiles with university, major, and location
- **Connections**: Search and connect with other students
- **Class Schedule**: Visual weekly schedule management
- **Travel Planning**: Search flights, trains, and buses between locations
- **Partner Dashboard**: View connected partners' information and schedules

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with your environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

3. Start the development server:
```bash
npm run dev
```

The app will run on `http://localhost:3000`

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Supabase**: Authentication and database
- **date-fns**: Date formatting utilities

## Project Structure

```
app/
├── (auth)/              # Authentication pages
│   ├── login/          # Login page
│   └── signup/         # Sign up page
├── dashboard/          # Main dashboard
├── profile/            # Profile management
│   └── setup/          # Initial profile setup
├── schedule/           # Schedule management
├── travel/             # Travel planning
├── connections/        # Partner connections
├── layout.tsx          # Root layout
└── page.tsx            # Home/landing page

lib/
├── supabase.ts         # Supabase client
└── api.ts              # API client functions

types/
└── index.ts            # TypeScript type definitions
```

## Pages

### Authentication
- `/login` - Sign in page
- `/signup` - Create new account
- `/profile/setup` - Complete profile after signup

### Main App
- `/dashboard` - Main dashboard with connections and quick actions
- `/profile` - Edit user profile
- `/schedule` - Manage class schedule
- `/travel` - Search and plan travel
- `/connections` - Find and manage partner connections

## API Integration

The frontend connects to the backend API (default: `http://localhost:3001`) for:
- User profile management
- Connection requests
- Schedule CRUD operations
- Travel search (flights, trains, buses)
- Saved travel plans

## Development

To run the development server:
```bash
npm run dev
```

To build for production:
```bash
npm run build
npm start
```

## Deployment

The app is optimized for deployment on [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

Make sure to:
- Set environment variables in Vercel dashboard
- Update `NEXT_PUBLIC_API_URL` to your production backend URL
- Configure CORS in your backend to allow requests from your Vercel domain
