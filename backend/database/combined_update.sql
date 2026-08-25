-- Bridge The Gap — combined Supabase update
-- Run once in: Supabase Dashboard → SQL Editor → New query
-- Project: https://supabase.com/dashboard (PostgreSQL via Supabase)
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS / ON CONFLICT

-- =============================================================================
-- 1) Users: display name
-- =============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

UPDATE users
SET name = SPLIT_PART(email, '@', 1)
WHERE name IS NULL;

-- =============================================================================
-- 2) Users: shareable public_id
-- =============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS public_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_public_id ON users(public_id);

CREATE OR REPLACE FUNCTION generate_public_id() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  user_record RECORD;
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  FOR user_record IN SELECT id FROM users WHERE public_id IS NULL LOOP
    LOOP
      new_id := generate_public_id();
      SELECT EXISTS(SELECT 1 FROM users WHERE public_id = new_id) INTO id_exists;
      EXIT WHEN NOT id_exists;
    END LOOP;
    UPDATE users SET public_id = new_id WHERE id = user_record.id;
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'public_id'
  ) AND NOT EXISTS (SELECT 1 FROM users WHERE public_id IS NULL) THEN
    ALTER TABLE users ALTER COLUMN public_id SET NOT NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION set_public_id() RETURNS TRIGGER AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  IF NEW.public_id IS NULL THEN
    LOOP
      new_id := generate_public_id();
      SELECT EXISTS(SELECT 1 FROM users WHERE public_id = new_id) INTO id_exists;
      EXIT WHEN NOT id_exists;
    END LOOP;
    NEW.public_id := new_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_public_id ON users;
CREATE TRIGGER trigger_set_public_id
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_public_id();

DROP POLICY IF EXISTS "Users can view profiles by public_id" ON users;
CREATE POLICY "Users can view profiles by public_id" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================================================
-- 3) Auto-create public.users row when auth user signs up
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_public_id TEXT;
  id_exists BOOLEAN;
  default_name TEXT;
BEGIN
  LOOP
    new_public_id := generate_public_id();
    SELECT EXISTS(SELECT 1 FROM users WHERE public_id = new_public_id) INTO id_exists;
    EXIT WHEN NOT id_exists;
  END LOOP;

  default_name := SPLIT_PART(NEW.email, '@', 1);

  INSERT INTO public.users (id, email, name, public_id, created_at, updated_at)
  VALUES (NEW.id, NEW.email, default_name, new_public_id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.create_missing_user_profiles()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  new_public_id TEXT;
  id_exists BOOLEAN;
  default_name TEXT;
  created_count INTEGER := 0;
BEGIN
  FOR user_record IN
    SELECT au.id, au.email
    FROM auth.users au
    LEFT JOIN public.users u ON au.id = u.id
    WHERE u.id IS NULL
  LOOP
    LOOP
      new_public_id := generate_public_id();
      SELECT EXISTS(SELECT 1 FROM users WHERE public_id = new_public_id) INTO id_exists;
      EXIT WHEN NOT id_exists;
    END LOOP;

    default_name := SPLIT_PART(user_record.email, '@', 1);

    INSERT INTO public.users (id, email, name, public_id, created_at, updated_at)
    VALUES (user_record.id, user_record.email, default_name, new_public_id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    created_count := created_count + 1;
  END LOOP;

  RETURN created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT public.create_missing_user_profiles();

-- =============================================================================
-- 4) Maison revamp: travel partner, occasions, invitations, visits
-- =============================================================================
ALTER TABLE travel_plans
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_travel_plans_partner ON travel_plans(partner_id);

CREATE TABLE IF NOT EXISTS occasions (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  collection TEXT NOT NULL CHECK (collection IN ('seasonal', 'small-nights', 'long-weekends')),
  month INTEGER,
  day INTEGER,
  lead_days INTEGER NOT NULL DEFAULT 42,
  kicker TEXT,
  prompt TEXT,
  letter_greeting TEXT,
  letter_body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  occasion_slug TEXT NOT NULL,
  proposed_date DATE NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'later')),
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_invite CHECK (from_user_id != to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_invitations_to ON invitations(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_invitations_from ON invitations(from_user_id, status);
CREATE INDEX IF NOT EXISTS idx_invitations_pair ON invitations(from_user_id, to_user_id);

CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  traveler_id UUID REFERENCES users(id) ON DELETE SET NULL,
  travel_plan_id UUID REFERENCES travel_plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'booked')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_visit CHECK (user1_id != user2_id)
);

CREATE INDEX IF NOT EXISTS idx_visits_user1 ON visits(user1_id, status);
CREATE INDEX IF NOT EXISTS idx_visits_user2 ON visits(user2_id, status);
CREATE INDEX IF NOT EXISTS idx_visits_dates ON visits(start_date);

ALTER TABLE occasions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Occasions are public" ON occasions;
CREATE POLICY "Occasions are public" ON occasions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their invitations" ON invitations;
CREATE POLICY "Users can view their invitations" ON invitations
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

DROP POLICY IF EXISTS "Users can send invitations" ON invitations;
CREATE POLICY "Users can send invitations" ON invitations
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "Users can update their invitations" ON invitations;
CREATE POLICY "Users can update their invitations" ON invitations
  FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

DROP POLICY IF EXISTS "Users can view their visits" ON visits;
CREATE POLICY "Users can view their visits" ON visits
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can create visits" ON visits;
CREATE POLICY "Users can create visits" ON visits
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can update their visits" ON visits;
CREATE POLICY "Users can update their visits" ON visits
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can delete their visits" ON visits;
CREATE POLICY "Users can delete their visits" ON visits
  FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

INSERT INTO occasions (slug, title, collection, month, day, lead_days, kicker, prompt, letter_greeting, letter_body)
VALUES
  ('halloween', 'Halloween', 'seasonal', 10, 31, 42, '31 October',
   'Costumes, a film, or just the walk home in the cold. Decide it now.',
   'For the night of the 31st',
   'If we wait until the week of, we will be tired and it will slip. Here is a date, a plan, and a yes waiting for you.'),
  ('valentines', 'Valentine''s Day', 'seasonal', 2, 14, 42, '14 February',
   'The day gets expensive when it is last-minute. It gets easy when it is already on the calendar.',
   'For the 14th',
   'Not a performance. A reserved evening, a train or a flight if we need it, and a time that is ours.'),
  ('new-years', 'New Year''s Eve', 'seasonal', 12, 31, 45, '31 December',
   'Tickets and trains vanish in December. Put a city on the letter now.',
   'For the last night of the year',
   'We can be in one room, or on one call at midnight. Either way it should be chosen, not leftover.'),
  ('winter-break', 'Winter break', 'long-weekends', 12, 20, 50, 'Late December',
   'The longest stretch you get. Protect a few days before the calendar fills with family only.',
   'For the break',
   'Before we promise every day to other people, I am holding these dates for us.'),
  ('summer-break', 'Summer', 'long-weekends', 6, 1, 60, 'June',
   'Internships and sublets scatter people. Name the weeks you will be in the same city.',
   'For the summer',
   'Tell me the weeks you can actually be here — or I will come there. We write it down so it does not become August panic.'),
  ('thanksgiving', 'Thanksgiving week', 'long-weekends', 11, 26, 40, 'Late November',
   'Everyone travels. Fares jump. Decide whose table, and whose airport, early.',
   'For the long weekend',
   'If we are splitting families, we still pick a night that is only ours — before or after the meal.'),
  ('spring-break', 'Spring break', 'long-weekends', 3, 15, 45, 'March',
   'Campuses empty on different weeks. Overlay the calendars before you assume you match.',
   'For the break in March',
   'Our weeks may not line up. If they do not, we pick one weekend and treat it as the break.'),
  ('small-thursday', 'A Thursday in', 'small-nights', NULL, NULL, 7, 'Any week',
   'Not a holiday. A night you both keep, so the week has a middle.',
   'For Thursday',
   'No occasion. I am putting Thursday on the table so we do not only talk when something is wrong.'),
  ('grocery-date', 'Errands, together', 'small-nights', NULL, NULL, 10, 'Ordinary',
   'The visit is better when it includes the boring parts.',
   'For a useless afternoon',
   'When you are here, we do the grocery run. That is the date. It is how a house feels.'),
  ('first-weekend', 'The next open weekend', 'small-nights', NULL, NULL, 14, 'Soon',
   'Not a holiday. The first Saturday you both still have.',
   'For the coming weekend',
   'If we keep waiting for a perfect stretch, we will keep rushing. This is the next one that is free.')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  collection = EXCLUDED.collection,
  month = EXCLUDED.month,
  day = EXCLUDED.day,
  lead_days = EXCLUDED.lead_days,
  kicker = EXCLUDED.kicker,
  prompt = EXCLUDED.prompt,
  letter_greeting = EXCLUDED.letter_greeting,
  letter_body = EXCLUDED.letter_body;

-- =============================================================================
-- 5) Couple calendar dates
-- =============================================================================
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
