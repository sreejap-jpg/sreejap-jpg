// One-time fix: fetches author names + PDF URLs from Gutendex for all 107 imported books
// and updates the books table. Run with: node scripts/update_authors_and_pdfs.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hbvftjlsexxbqbsppsdg.supabase.co';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhidmZ0amxzZXh4YnFic3Bwc2RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNDY4MTYsImV4cCI6MjEwMTgyMjgxNn0.2Rr3byuWQLbUAp7lcWguuORS9Lc5l5nDB_-9XEitcUA';
const KEY = SERVICE_ROLE || ANON_KEY;

const supabase = createClient(SUPABASE_URL, KEY, { auth: { persistSession: false } });

function extractPdf(book) {
  const fmts = book.formats || {};
  if (fmts['application/pdf']) return fmts['application/pdf'];
  if (fmts['application/octet-stream']) return fmts['application/octet-stream'];
  return null;
}

function getAuthor(book) {
  if (book.authors && book.authors[0]) return book.authors[0].name;
  return 'Unknown author';
}

// Search Gutendex by title, return best match
async function searchGutendex(title) {
  const url = `https://gutendex.com/books?search=${encodeURIComponent(title)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Search failed for "${title}": ${res.status}`);
  const json = await res.json();
  return json.results || [];
}

function findBestMatch(title, results) {
  // Exact title match first
  let match = results.find(b => b.title === title);
  if (match) return match;
  // Case-insensitive match
  const lower = title.toLowerCase();
  match = results.find(b => b.title.toLowerCase() === lower);
  if (match) return match;
  // Starts-with match
  match = results.find(b => b.title.toLowerCase().startsWith(lower) || lower.startsWith(b.title.toLowerCase()));
  if (match) return match;
  // First result
  return results[0];
}

async function main() {
  console.log('Fetching all books from database...');
  const { data: books, error } = await supabase.from('books').select('id, title, pdf_url, author_name').order('title');
  if (error) { console.error('DB error:', error.message); process.exit(1); }
  console.log(`Found ${books.length} books in database`);

  let updated = 0;
  let failed = 0;
  const batchSize = 5;

  for (let i = 0; i < books.length; i += batchSize) {
    const batch = books.slice(i, i + batchSize);
    const updates = await Promise.allSettled(batch.map(async (book) => {
      const results = await searchGutendex(book.title);
      if (!results.length) {
        console.log(`  NO MATCH: "${book.title}"`);
        return null;
      }
      const match = findBestMatch(book.title, results);
      const author = getAuthor(match);
      const pdf = extractPdf(match);
      const updates = {};
      if (!book.author_name) updates.author_name = author;
      if (!book.pdf_url && pdf) updates.pdf_url = pdf;
      if (Object.keys(updates).length === 0) return { id: book.id, title: book.title, author, pdf: book.pdf_url, skipped: true };
      const { error: upErr } = await supabase.from('books').update(updates).eq('id', book.id);
      if (upErr) { console.log(`  UPDATE FAIL: "${book.title}": ${upErr.message}`); return null; }
      return { id: book.id, title: book.title, author, pdf: pdf || book.pdf_url };
    }));

    for (const r of updates) {
      if (r.status === 'fulfilled' && r.value) {
        updated++;
        if (!r.value.skipped) console.log(`  OK: "${r.value.title}" -> ${r.value.author} | pdf: ${r.value.pdf ? 'yes' : 'no'}`);
      } else if (r.status === 'rejected') {
        failed++;
        console.log(`  ERROR: ${r.reason?.message || r.reason}`);
      }
    }
    console.log(`  Progress: ${Math.min(i + batchSize, books.length)}/${books.length}`);
  }

  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`);

  // Final verification
  const { data: final } = await supabase.from('books').select('id, author_name, pdf_url');
  const withAuthor = final.filter(b => b.author_name).length;
  const withPdf = final.filter(b => b.pdf_url).length;
  console.log(`Final counts: ${withAuthor}/${final.length} with author_name, ${withPdf}/${final.length} with pdf_url`);
}

main().catch(e => { console.error(e); process.exit(1); });
