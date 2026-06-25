-- Profiles table — account / personal settings (one row per user)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  phone TEXT,
  occupation TEXT,
  salary DECIMAL(14, 2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT now()
);

-- RLS — allow all for now (mock user_id setup, matching 001_init.sql).
-- In production with real auth, replace 'user-1' with auth.uid().
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all profiles" ON profiles
  FOR ALL USING (true);

-- Seed the default profile.
INSERT INTO profiles (user_id, name, email, salary) VALUES
  ('user-1', 'Regan', 'regan@email.com', 5200)
ON CONFLICT (user_id) DO NOTHING;
