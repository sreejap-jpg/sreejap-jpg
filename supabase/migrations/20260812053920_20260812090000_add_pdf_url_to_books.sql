/*
# Add PDF links to books

1. New Columns
- `books.pdf_url` (text, nullable): optional URL for a book PDF stored in Supabase File Storage or another approved file location.

2. Existing Data
- No existing book, chapter, profile, or reading-progress data is removed or changed.
- Existing chapter-based books remain supported when `pdf_url` is null.

3. Security
- The new column inherits the existing `books` row-level security policies, so published PDFs are readable through the same public book access rules and only owners can edit their book records.

4. Important Notes
- PDF reading is selected by the presence of `pdf_url`.
- A null value intentionally keeps the current chapter reader behavior.
*/

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS pdf_url text;