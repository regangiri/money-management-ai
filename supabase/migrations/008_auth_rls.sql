-- Enforce per-user row-level security now that real auth is in place.
-- user_id columns are TEXT and store the auth user's UUID as text, so we
-- compare against auth.uid()::text.

-- ---- Transactions ----
DROP POLICY IF EXISTS "Allow all transactions" ON transactions;
CREATE POLICY "Users manage own transactions" ON transactions
  FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- ---- Budgets ----
DROP POLICY IF EXISTS "Allow all budgets" ON budgets;
CREATE POLICY "Users manage own budgets" ON budgets
  FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- ---- Holdings ----
DROP POLICY IF EXISTS "Allow all holdings" ON holdings;
CREATE POLICY "Users manage own holdings" ON holdings
  FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- ---- Profiles ----
DROP POLICY IF EXISTS "Allow all profiles" ON profiles;
CREATE POLICY "Users manage own profile" ON profiles
  FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- ---- Wishlist ----
DROP POLICY IF EXISTS "Allow all wishlist" ON wishlist;
CREATE POLICY "Users manage own wishlist" ON wishlist
  FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Create a profile row automatically when a new account signs up, seeding it
-- with the name (from signup metadata) and email.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id::text,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
