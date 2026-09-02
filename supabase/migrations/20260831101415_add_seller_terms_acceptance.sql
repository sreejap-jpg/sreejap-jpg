/*
# Create seller_terms_acceptances table

1. Purpose
   Records when a user agrees to the Kathazo Seller & Publisher Terms & Conditions.
   Required before a user can list their first book for sale.

2. New Tables
   - `seller_terms_acceptances`
     - `id` (uuid, primary key)
     - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users, cascade delete)
     - `accepted_at` (timestamptz, not null, defaults to now())
     - Unique constraint on user_id so only one acceptance record per user

3. Security
   - RLS enabled.
   - Each authenticated user can read and insert only their own acceptance record.
   - No updates or deletes needed (acceptance is immutable once recorded).
*/

CREATE TABLE IF NOT EXISTS seller_terms_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE seller_terms_acceptances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seller_terms_select_own" ON seller_terms_acceptances;
CREATE POLICY "seller_terms_select_own" ON seller_terms_acceptances FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "seller_terms_insert_own" ON seller_terms_acceptances;
CREATE POLICY "seller_terms_insert_own" ON seller_terms_acceptances FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
