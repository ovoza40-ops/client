-- ══════════════════════════════════════════
--  LinguaBook Pro — Supabase Database Schema
--  Supabase SQL Editor ga joylashtiring
-- ══════════════════════════════════════════

-- 1. Profiles (foydalanuvchi profillari)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'freemium' CHECK (role IN ('freemium', 'premium', 'admin')),
  wallet_balance DECIMAL DEFAULT 10,
  streak_days INTEGER DEFAULT 0,
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, wallet_balance)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'freemium',
    10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Books (kitoblar)
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  original_language TEXT,
  translated_language TEXT,
  file_url TEXT,
  cover_url TEXT,
  page_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  is_paid BOOLEAN DEFAULT false,
  price DECIMAL DEFAULT 0,
  total_reads INTEGER DEFAULT 0,
  avg_rating DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'ready' CHECK (status IN ('processing', 'ready', 'error', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chapters (kitob boblari — Audio uchun)
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  audio_url TEXT,
  audio_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, chapter_number)
);

-- 4. Ratings (reytinglar va izohlar)
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, user_id)
);

-- Auto-update avg_rating
CREATE OR REPLACE FUNCTION update_book_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE books
  SET avg_rating = (SELECT AVG(stars) FROM ratings WHERE book_id = NEW.book_id)
  WHERE id = NEW.book_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_rating_change ON ratings;
CREATE TRIGGER on_rating_change
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_book_avg_rating();

-- 5. Purchases (sotib olishlar)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id),
  buyer_id UUID REFERENCES profiles(id),
  amount DECIMAL NOT NULL,
  seller_share DECIMAL NOT NULL,
  platform_share DECIMAL NOT NULL,
  payment_method TEXT DEFAULT 'mock',
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, buyer_id)
);

-- 6. Transactions (hamyon tranzaksiyalari)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earning', 'purchase', 'withdrawal', 'subscription')),
  amount DECIMAL NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Wallet increment function
CREATE OR REPLACE FUNCTION increment_wallet(user_id UUID, amount DECIMAL)
RETURNS void AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() <> user_id THEN
    PERFORM 1 FROM profiles WHERE id = auth.uid() AND role = 'admin';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;

  UPDATE profiles
  SET wallet_balance = wallet_balance + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Row Level Security (RLS) ──────────────────────
ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE books      ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases  ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
  auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Books policies
CREATE POLICY "Public books viewable by everyone" ON books FOR SELECT USING (is_public = true OR auth.uid() = uploader_id);
CREATE POLICY "Authenticated users can insert books" ON books FOR INSERT WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Users can update own books" ON books FOR UPDATE USING (auth.uid() = uploader_id);
CREATE POLICY "Admins can update all books" ON books FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Chapters policies
CREATE POLICY "Chapters viewable if book is accessible" ON chapters FOR SELECT
  USING (EXISTS (SELECT 1 FROM books WHERE id = book_id AND (is_public = true OR uploader_id = auth.uid())));
CREATE POLICY "Book owners can manage chapters" ON chapters FOR ALL
  USING (EXISTS (SELECT 1 FROM books WHERE id = book_id AND uploader_id = auth.uid()));

-- Ratings policies
CREATE POLICY "Ratings are public" ON ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can rate" ON ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rating" ON ratings FOR UPDATE USING (auth.uid() = user_id);

-- Purchases policies
CREATE POLICY "Users can see own purchases" ON purchases FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Users can create purchases" ON purchases FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Transactions policies
CREATE POLICY "Users can see own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Transactions can be created by owner or admin" ON transactions FOR INSERT WITH CHECK (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ── Indexes ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_books_public      ON books(is_public, status);
CREATE INDEX IF NOT EXISTS idx_books_uploader    ON books(uploader_id);
CREATE INDEX IF NOT EXISTS idx_books_lang        ON books(translated_language);
CREATE INDEX IF NOT EXISTS idx_chapters_book     ON chapters(book_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_ratings_book      ON ratings(book_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer   ON purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);

-- ── Storage buckets (Supabase Dashboard > Storage da yarating) ──
-- Bucket name: books   (public: false)
-- Bucket name: audio   (public: true)
-- Bucket name: covers  (public: true)
