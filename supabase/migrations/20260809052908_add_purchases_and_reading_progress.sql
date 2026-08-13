/*
# Kathazo — purchases and reading progress

1. Overview
Adds two new tables to support the extended account/dashboard features:
- `purchases` — records a user's purchase of a marketplace listing (mock checkout for now).
- `reading_progress` — tracks which book/chapter a user is currently reading, plus their position.

2. New Tables
- `purchases`
  - `id` (uuid, primary key)
  - `buyer_id` (uuid, not null, defaults to auth.uid()) — the user who bought the book.
  - `listing_id` (uuid, references marketplace_listings) — the listing that was purchased.
  - `book_id` (uuid, references books) — denormalized for easy dashboard queries.
  - `price_cents` (integer) — the price paid at time of purchase.
  - `currency` (text, default USD)
  - `status` (text, default 'completed') — mock checkout status.
  - `created_at` (timestamptz)
- `reading_progress`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid()) — the reader.
  - `book_id` (uuid, references books) — the book being read.
  - `chapter_id` (uuid, references chapters, nullable) — last chapter opened.
  - `chapter_index` (integer, default 0) — position within the book's chapter list.
  - `progress_pct` (numeric, default 0) — reading progress percentage.
  - `updated_at` (timestamptz)
  - Unique on (user_id, book_id) so each user has one progress row per book.

3. Security
- RLS enabled on both tables.
- purchases: owner-scoped — a buyer can only see/insert their own purchases.
- reading_progress: owner-scoped — a user can only see/insert/update their own progress rows.
- Both tables use `DEFAULT auth.uid()` on the owner column so client inserts that omit it still satisfy RLS.
- Four separate CRUD policies per table (no FOR ALL).

4. Important notes
- These tables support the dashboard "books purchased" and "currently reading" sections.
- reading_progress is upserted from the Read page as the user navigates chapters.
- purchases are created by the mock checkout flow on the Marketplace page.
*/

-- =============================================================
-- purchases
-- =============================================================
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES marketplace_listings(id) ON DELETE SET NULL,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','pending','refunded')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS purchases_buyer_id_idx ON purchases(buyer_id);
CREATE INDEX IF NOT EXISTS purchases_book_id_idx ON purchases(book_id);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "purchases_select_own" ON purchases;
CREATE POLICY "purchases_select_own" ON purchases FOR SELECT
  TO authenticated USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "purchases_insert_own" ON purchases;
CREATE POLICY "purchases_insert_own" ON purchases FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "purchases_update_own" ON purchases;
CREATE POLICY "purchases_update_own" ON purchases FOR UPDATE
  TO authenticated USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "purchases_delete_own" ON purchases;
CREATE POLICY "purchases_delete_own" ON purchases FOR DELETE
  TO authenticated USING (auth.uid() = buyer_id);

-- =============================================================
-- reading_progress
-- =============================================================
CREATE TABLE IF NOT EXISTS reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES chapters(id) ON DELETE SET NULL,
  chapter_index integer NOT NULL DEFAULT 0,
  progress_pct numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS reading_progress_user_id_idx ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS reading_progress_book_id_idx ON reading_progress(book_id);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "progress_select_own" ON reading_progress;
CREATE POLICY "progress_select_own" ON reading_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "progress_insert_own" ON reading_progress;
CREATE POLICY "progress_insert_own" ON reading_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "progress_update_own" ON reading_progress;
CREATE POLICY "progress_update_own" ON reading_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "progress_delete_own" ON reading_progress;
CREATE POLICY "progress_delete_own" ON reading_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger for reading_progress
DROP TRIGGER IF EXISTS reading_progress_set_updated_at ON reading_progress;
CREATE TRIGGER reading_progress_set_updated_at BEFORE UPDATE ON reading_progress
  FOR EACH ROW EXECUTE FUNCTION kathazo_set_updated_at();
