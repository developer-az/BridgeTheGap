-- Bridge The Gap Database Schema
-- Run this in your Supabase SQL Editor

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  university_name TEXT,
  major TEXT,
  location_city TEXT,
  location_state TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can view other profiles" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Connections table
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_connection UNIQUE (user1_id, user2_id)
);

-- Enable Row Level Security
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Connections policies
CREATE POLICY "Users can view their connections" ON connections
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create connections" ON connections
  FOR INSERT WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can update their connections" ON connections
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete their connections" ON connections
  FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title TEXT,
  type TEXT NOT NULL DEFAULT 'class' CHECK (type IN ('class', 'work', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Schedules policies
CREATE POLICY "Users can view their own schedule" ON schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedule entries" ON schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule entries" ON schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule entries" ON schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Allow users to view schedules of their connections
CREATE POLICY "Users can view connected users schedules" ON schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM connections
      WHERE (connections.user1_id = auth.uid() AND connections.user2_id = schedules.user_id
             OR connections.user2_id = auth.uid() AND connections.user1_id = schedules.user_id)
        AND connections.status = 'accepted'
    )
  );

-- Travel Plans table
CREATE TABLE IF NOT EXISTS travel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  travel_date DATE NOT NULL,
  return_date DATE,
  preferred_method TEXT CHECK (preferred_method IN ('flight', 'train', 'bus', 'any')),
  saved_routes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;

-- Travel plans policies
CREATE POLICY "Users can view their own travel plans" ON travel_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own travel plans" ON travel_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own travel plans" ON travel_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own travel plans" ON travel_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_connections_user1 ON connections(user1_id);
CREATE INDEX IF NOT EXISTS idx_connections_user2 ON connections(user2_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_travel_plans_user ON travel_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university_name);

