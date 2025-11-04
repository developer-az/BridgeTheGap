-- Bridge The Gap Database Schema
-- Run this in your Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  university_name TEXT,
  major TEXT,
  location_city TEXT,
  location_state TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connections table (for linking two users together)
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_connection UNIQUE (user1_id, user2_id),
  CONSTRAINT no_self_connection CHECK (user1_id != user2_id)
);

-- Schedules table (for class schedules)
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title TEXT, -- e.g., "Computer Science 101"
  type TEXT DEFAULT 'class' CHECK (type IN ('class', 'work', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- Travel plans table
CREATE TABLE IF NOT EXISTS travel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  travel_date DATE NOT NULL,
  return_date DATE,
  preferred_method TEXT CHECK (preferred_method IN ('flight', 'train', 'bus', 'any')),
  saved_routes JSONB, -- Store selected routes/options
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_connections_user1 ON connections(user1_id);
CREATE INDEX IF NOT EXISTS idx_connections_user2 ON connections(user2_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_schedules_user ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_travel_plans_user ON travel_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_plans_date ON travel_plans(travel_date);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for connections table
CREATE POLICY "Users can view their connections" ON connections
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create connections" ON connections
  FOR INSERT WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can update their connections" ON connections
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete their connections" ON connections
  FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for schedules table
CREATE POLICY "Users can view their own schedule" ON schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view connected users' schedules" ON schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM connections 
      WHERE (user1_id = auth.uid() AND user2_id = schedules.user_id AND status = 'accepted')
         OR (user2_id = auth.uid() AND user1_id = schedules.user_id AND status = 'accepted')
    )
  );

CREATE POLICY "Users can manage their own schedule" ON schedules
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for travel_plans table
CREATE POLICY "Users can manage their own travel plans" ON travel_plans
  FOR ALL USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

