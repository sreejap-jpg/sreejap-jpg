/*
# Kathazo — initial schema

1. Overview
Creates the core tables for a literary community platform: reader/writer/author/publisher
profiles, books with chapters, author follows, and a marketplace for selling books.

2. New Tables
- `profiles` — extends auth.users with a public author/reader identity (display name, bio, avatar url, role).
- `books` — a literary work; authored by a user. Has title, description, cover image url, genre, status (draft/published).
- `chapters` — a chapter belonging to a book. Has title, body (markdown/plain text), ordering, status.
- `follows` — a reader follows an author (author_id = followed user). Prevents duplicates via unique constraint.
- `marketplace_listings` — a book listed for sale. Has price_cents, currency, condition, seller (the book's author), stock, status.

3. Security
- RLS enabled on every table.
- Profiles: anyone (anon) can read profiles; only the owner can update/insert their own row.
- Books: anyone can read published books; only the author can insert/update/delete their own books.
- Chapters: anyone can read chapters of published books; only the book's author can manage chapters (checked via the parent book's user_id).
- Follows: anyone can read who follows whom; only an authenticated user can follow (insert) or unfollow (delete) for themselves.
- Marketplace listings: anyone can read active listings; only the book's author can create/update/delete a listing for their own book.

4. Important notes
- `user_id` / `author_id` columns default to `auth.uid()` so inserts from the client that omit them still satisfy RLS.
- Child tables (chapters, marketplace_listings) check ownership through the parent `books.user_id` rather than a direct user_id column.
- All policies are split into the four CRUD verbs (no FOR ALL).
- `auth.uid()` is used everywhere — never `current_user`.
*/

-- =============================================================
-- profiles
-- =============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  role text NOT NULL DEFAULT 'reader' CHECK (role IN ('reader','writer','author','bookseller','publisher')),
  website text DEFAULT '',
  location text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =============================================================
-- books
-- =============================================================
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  cover_url text DEFAULT '',
  genre text DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  is_for_sale boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS books_user_id_idx ON books(user_id);
CREATE INDEX IF NOT EXISTS books_genre_idx ON books(genre);
CREATE INDEX IF NOT EXISTS books_status_idx ON books(status);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "books_select_published" ON books;
CREATE POLICY "books_select_published" ON books FOR SELECT
  TO anon, authenticated USING (status = 'published' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "books_insert_own" ON books;
CREATE POLICY "books_insert_own" ON books FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "books_update_own" ON books;
CREATE POLICY "books_update_own" ON books FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "books_delete_own" ON books;
CREATE POLICY "books_delete_own" ON books FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =============================================================
-- chapters
-- =============================================================
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Chapter',
  body text DEFAULT '',
  chapter_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chapters_book_id_idx ON chapters(book_id);
CREATE INDEX IF NOT EXISTS chapters_book_order_idx ON chapters(book_id, chapter_order);

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chapters_select_published" ON chapters;
CREATE POLICY "chapters_select_published" ON chapters FOR SELECT
  TO anon, authenticated USING (
    status = 'published'
    OR EXISTS (
      SELECT 1 FROM books b WHERE b.id = chapters.book_id AND b.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "chapters_insert_own" ON chapters;
CREATE POLICY "chapters_insert_own" ON chapters FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM books b WHERE b.id = chapters.book_id AND b.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "chapters_update_own" ON chapters;
CREATE POLICY "chapters_update_own" ON chapters FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM books b WHERE b.id = chapters.book_id AND b.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM books b WHERE b.id = chapters.book_id AND b.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "chapters_delete_own" ON chapters;
CREATE POLICY "chapters_delete_own" ON chapters FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM books b WHERE b.id = chapters.book_id AND b.user_id = auth.uid())
  );

-- =============================================================
-- follows
-- =============================================================
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, author_id)
);

CREATE INDEX IF NOT EXISTS follows_author_id_idx ON follows(author_id);
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON follows(follower_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select_all" ON follows;
CREATE POLICY "follows_select_all" ON follows FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "follows_insert_own" ON follows;
CREATE POLICY "follows_insert_own" ON follows FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "follows_delete_own" ON follows;
CREATE POLICY "follows_delete_own" ON follows FOR DELETE
  TO authenticated USING (auth.uid() = follower_id);

-- =============================================================
-- marketplace_listings
-- =============================================================
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'USD',
  condition text NOT NULL DEFAULT 'new' CHECK (condition IN ('new','like-new','good','acceptable')),
  stock integer NOT NULL DEFAULT 1 CHECK (stock >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','paused')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_book_id_idx ON marketplace_listings(book_id);
CREATE INDEX IF NOT EXISTS marketplace_status_idx ON marketplace_listings(status);

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listings_select_active" ON marketplace_listings;
CREATE POLICY "listings_select_active" ON marketplace_listings FOR SELECT
  TO anon, authenticated USING (status = 'active' OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "listings_insert_own" ON marketplace_listings;
CREATE POLICY "listings_insert_own" ON marketplace_listings FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = seller_id
    AND EXISTS (
      SELECT 1 FROM books b WHERE b.id = marketplace_listings.book_id AND b.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "listings_update_own" ON marketplace_listings;
CREATE POLICY "listings_update_own" ON marketplace_listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "listings_delete_own" ON marketplace_listings;
CREATE POLICY "listings_delete_own" ON marketplace_listings FOR DELETE
  TO authenticated USING (auth.uid() = seller_id);

-- =============================================================
-- updated_at trigger
-- =============================================================
CREATE OR REPLACE FUNCTION kathazo_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION kathazo_set_updated_at();

DROP TRIGGER IF EXISTS books_set_updated_at ON books;
CREATE TRIGGER books_set_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION kathazo_set_updated_at();

DROP TRIGGER IF EXISTS chapters_set_updated_at ON chapters;
CREATE TRIGGER chapters_set_updated_at BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION kathazo_set_updated_at();

DROP TRIGGER IF EXISTS marketplace_set_updated_at ON marketplace_listings;
CREATE TRIGGER marketplace_set_updated_at BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION kathazo_set_updated_at();

-- =============================================================
-- follower count helper view
-- =============================================================
CREATE OR REPLACE VIEW author_follower_counts AS
SELECT author_id, COUNT(*)::integer AS follower_count
FROM follows
GROUP BY author_id;
