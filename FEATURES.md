# Bridge The Gap - Features Overview

Complete feature list for the long-distance relationship platform.

## 🎓 User Profiles

### Profile Information
- **University Name** - Display which university you attend
- **Major** - Share your field of study
- **Location** - City and state for travel planning
- **Bio** - Personal description and interests
- **Email** - Verified through Supabase authentication

### Profile Management
- ✅ Create profile during signup
- ✅ Edit profile anytime from dashboard
- ✅ View your own profile
- ✅ View partner profiles in connections
- ✅ Search for users by university name

**Pages:**
- `/profile/setup` - Initial profile creation
- `/profile` - Edit existing profile

---

## 🤝 Connection System

### Finding Partners
- **Search by University** - Find students at specific schools
- **Browse All Users** - See all registered users
- **View Profiles** - See university, major, location for each user

### Managing Connections
- ✅ Send connection requests
- ✅ Accept incoming requests
- ✅ Decline unwanted requests
- ✅ Remove existing connections
- ✅ View connection status (pending/accepted)

### Connection Display
- **Active Connections** - Partners you're connected with
- **Pending Requests** - Incoming requests awaiting response
- **Quick Actions** - View schedule or plan travel with partners

**Pages:**
- `/connections` - Search and manage all connections

---

## 📅 Class Schedule Management

### Schedule Features
- **Weekly Calendar View** - See your entire week at a glance
- **Day-by-Day Organization** - Sunday through Saturday
- **Time Blocks** - Start and end times for each commitment
- **Entry Types** - Class, Work, or Other
- **Custom Titles** - Name each schedule entry

### Schedule Operations
- ✅ Add new schedule entries
- ✅ Edit existing entries
- ✅ Delete entries
- ✅ View by day of week
- ✅ Color-coded display

### Entry Details
- **Day of Week** - Sunday (0) through Saturday (6)
- **Start Time** - When commitment begins
- **End Time** - When commitment ends
- **Title** - e.g., "CS 101" or "Work Shift"
- **Type** - Class, Work, or Other

**Pages:**
- `/schedule` - Your weekly schedule
- `/schedule/[userId]` - View partner's schedule

---

## 🗓️ Mutual Availability

### Availability Comparison
- View your schedule alongside partner's schedule
- Identify free time slots
- Find mutual availability for video calls
- Plan best times to visit

### Features
- ✅ Side-by-side schedule comparison
- ✅ Easy-to-read calendar grid
- ✅ Time zone consideration (manual)
- ✅ Weekly overview

**API Endpoint:**
- `GET /api/schedule/mutual/:partnerId`

---

## ✈️ Travel Planning

### Multi-Modal Search
Search and compare three types of transportation:

#### 1. Flights ✈️
- **Powered by:** Amadeus API (or mock data)
- **Shows:**
  - Price and currency
  - Flight duration
  - Departure/arrival airports
  - Flight numbers and carriers
  - Connection details
- **Features:**
  - One-way or round-trip
  - Multiple flight options
  - Direct and connecting flights

#### 2. Trains 🚂
- **Powered by:** Google Directions API (or mock data)
- **Shows:**
  - Price estimate
  - Total duration
  - Distance
  - Station names
  - Number of stops
  - Departure/arrival times
- **Features:**
  - Multiple route options
  - Transit line information
  - Real-time estimates

#### 3. Buses 🚌
- **Powered by:** Google Directions API (or mock data)
- **Shows:**
  - Price estimate
  - Total duration
  - Distance
  - Stop locations
  - Number of stops
  - Schedule information
- **Features:**
  - Multiple carrier options
  - Budget-friendly routes
  - Flexible scheduling

### Travel Search Features
- ✅ Enter origin and destination
- ✅ Select travel date
- ✅ Optional return date
- ✅ Choose transport modes (mix and match)
- ✅ Side-by-side comparison
- ✅ Save favorite routes
- ✅ View saved travel plans
- ✅ Delete old plans

### Smart Features
- **Partner Integration** - Click "Plan Travel" from partner profile to auto-fill destination
- **Quick Access** - Direct links from dashboard
- **Saved Plans** - Keep track of your favorite routes
- **Price Comparison** - Easy cost comparison across modes

**Pages:**
- `/travel` - Search and compare travel options

---

## 🏠 Dashboard

### Overview
Central hub showing all important information at a glance.

### Dashboard Sections

#### 1. Your Profile Card
- University name
- Major
- Location
- Bio
- Quick edit link

#### 2. Quick Actions
Three main action cards:
- **Schedule** - Manage your class schedule
- **Travel Plans** - Search travel options
- **Find Partners** - Connect with other students

#### 3. Your Connections
- **Active Connections** - See all connected partners
  - Partner university and major
  - Location information
  - View schedule button
  - Plan travel button
- **Pending Requests** - Incoming connection requests
  - Partner information
  - Accept/decline options
  - Notification badge

#### 4. Header
- App name and branding
- Profile link
- Logout button

**Pages:**
- `/dashboard` - Main dashboard

---

## 🔐 Authentication & Security

### Authentication Features
- **Email/Password** - Secure login via Supabase
- **Session Management** - Stay logged in
- **Protected Routes** - Auth required for all main pages
- **Secure Tokens** - JWT-based authentication

### Security Features
- ✅ Row Level Security (RLS) on all database tables
- ✅ User data isolation
- ✅ Secure password hashing
- ✅ Token-based API authentication
- ✅ CORS protection

### Pages
- `/login` - Sign in page
- `/signup` - Create account page
- `/` - Landing page with auth redirect

---

## 🔍 Search & Discovery

### User Search
- Search by university name
- Filter results
- View user profiles
- Send connection requests

### Features
- ✅ Real-time search
- ✅ Partial name matching
- ✅ Result limiting for performance
- ✅ Exclude yourself from results

---

## 💾 Data Management

### User Data
- **Stored in Supabase:**
  - User profiles
  - Connections
  - Schedules
  - Travel plans
  
### Privacy
- ✅ Only view connected users' schedules
- ✅ Control your own data
- ✅ Delete connections anytime
- ✅ Update profile information

---

## 🎨 User Interface

### Design Features
- **Modern & Clean** - Beautiful gradient backgrounds
- **Responsive** - Works on desktop and mobile
- **Intuitive** - Easy navigation
- **Color-Coded** - Different colors for different transport types
- **Loading States** - Clear feedback during operations
- **Error Handling** - Helpful error messages

### UI Components
- Modal dialogs for adding/editing
- Color-coded schedule entries
- Status badges (pending, accepted)
- Action buttons with hover states
- Form validation and feedback

---

## 🚀 Technical Features

### Frontend
- **Next.js 16** - Modern React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Client-Side Routing** - Fast page transitions
- **API Integration** - Centralized API client

### Backend
- **Express.js** - RESTful API server
- **TypeScript** - Type-safe backend
- **Supabase Integration** - Database and auth
- **API Aggregation** - Multiple travel data sources
- **Middleware** - Authentication and CORS

### Database
- **PostgreSQL** via Supabase
- **Row Level Security** - Data protection
- **Indexes** - Optimized queries
- **Foreign Keys** - Data integrity

---

## 📦 Complete API

### Users
- `GET /api/users/profile` - Get current user
- `POST /api/users/profile` - Update profile
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get specific user

### Connections
- `GET /api/connections` - List connections
- `POST /api/connections/request` - Request connection
- `PUT /api/connections/:id/accept` - Accept request
- `DELETE /api/connections/:id` - Delete connection

### Schedule
- `GET /api/schedule` - Your schedule
- `GET /api/schedule/user/:userId` - Partner schedule
- `GET /api/schedule/mutual/:partnerId` - Compare schedules
- `POST /api/schedule` - Add entry
- `PUT /api/schedule/:id` - Update entry
- `DELETE /api/schedule/:id` - Delete entry

### Travel
- `POST /api/travel/search` - Search options
- `GET /api/travel/plans` - Saved plans
- `POST /api/travel/plans` - Save plan
- `DELETE /api/travel/plans/:id` - Delete plan

---

## 🎯 Use Cases

### For Students
1. **Find Your Partner** - Search by university, send connection
2. **Share Schedules** - Add your classes, view when partner is free
3. **Plan Visits** - Search flights, trains, buses in one place
4. **Compare Prices** - See all options side-by-side
5. **Save Routes** - Keep favorite travel plans
6. **Stay Connected** - Know each other's availability

### For Interns
1. **Summer Planning** - Find travel options for internship location
2. **Weekend Visits** - Quick search for weekend trips
3. **Budget Travel** - Compare bus, train, and flight prices

### For Researchers
1. **Conference Travel** - Plan trips to partner's university
2. **Collaboration** - See availability for virtual meetings
3. **Visit Planning** - Coordinate research visits

---

## 🔮 Future Enhancements (Not Yet Implemented)

### Potential Features
- [ ] Real-time chat/messaging
- [ ] Push notifications
- [ ] Calendar integration (Google Calendar, iCal)
- [ ] Shared photo albums
- [ ] Visit countdown timer
- [ ] Cost splitting calculator
- [ ] University email verification
- [ ] Mobile app (React Native)
- [ ] Travel price alerts
- [ ] Shared wishlists
- [ ] Video call integration
- [ ] Travel history
- [ ] Multiple partner support
- [ ] Dark mode

---

## ✅ Current Status

**All Core Features: COMPLETE** ✅

- ✅ User authentication and profiles
- ✅ Connection system
- ✅ Class schedule management
- ✅ Mutual availability viewing
- ✅ Multi-modal travel search
- ✅ Saved travel plans
- ✅ Dashboard with quick actions
- ✅ Search and discovery
- ✅ Complete REST API
- ✅ Secure database with RLS
- ✅ Beautiful, responsive UI

**Ready for:** Testing with real users and Supabase setup!



