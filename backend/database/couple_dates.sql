-- Couple dates: shared important days for the two of you
-- Run in Supabase SQL editor after the maison revamp.

CREATE TABLE IF NOT EXISTS couple_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  end_date DATE,
  kind TEXT NOT NULL DEFAULT 'custom'
    CHECK (kind IN ('anniversary', 'birthday', 'first-met', 'visit', 'occasion', 'custom')),
  notes TEXT,
  recurring_yearly BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_couple_dates_user1 ON couple_dates(user1_id, date);
CREATE INDEX IF NOT EXISTS idx_couple_dates_user2 ON couple_dates(user2_id, date);
CREATE INDEX IF NOT EXISTS idx_couple_dates_date ON couple_dates(date);

ALTER TABLE couple_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their couple dates" ON couple_dates;
CREATE POLICY "Users can view their couple dates" ON couple_dates
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can create couple dates" ON couple_dates;
CREATE POLICY "Users can create couple dates" ON couple_dates
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update couple dates" ON couple_dates;
CREATE POLICY "Users can update couple dates" ON couple_dates
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can delete couple dates" ON couple_dates;
CREATE POLICY "Users can delete couple dates" ON couple_dates
  FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id OR auth.uid() = created_by);
