/*
# Kathazo — add social link columns to profiles

1. Overview
Adds three optional social link columns to the `profiles` table so authors can display
Twitter, Instagram, and Goodreads links on their profile page.

2. Modified Tables
- `profiles`
  - `twitter` (text, default '') — Twitter/X handle or profile URL.
  - `instagram` (text, default '') — Instagram handle or profile URL.
  - `goodreads` (text, default '') — Goodreads profile URL.

3. Security
- No policy changes. The existing profiles_select_all (public read) and profiles_update_own (owner update) policies already cover these new columns.

4. Important notes
- All three columns are nullable/empty-string defaults so existing rows are unaffected.
- Uses a DO $$ block with IF NOT EXISTS to make the column additions idempotent.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'twitter') THEN
    ALTER TABLE profiles ADD COLUMN twitter text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'instagram') THEN
    ALTER TABLE profiles ADD COLUMN instagram text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'goodreads') THEN
    ALTER TABLE profiles ADD COLUMN goodreads text DEFAULT '';
  END IF;
END $$;
