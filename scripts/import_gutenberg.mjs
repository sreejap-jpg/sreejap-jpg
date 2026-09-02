// One-time data import: pulls popular public-domain books from the Gutendex API
// (https://gutendex.com/books?sort=popular) and inserts each into the `books` table.
// Only books with a formats["application/pdf"] link are kept; we scan pages until we
// collect 100 such books. Run with: node scripts/import_gutenberg.mjs
import { readFileSync } from 'node:fs';

const SUPABASE_URL = 'https://hbvftjlsexxbqbsppsdg.supabase.co';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhidmZ0amxzZXh4YnFic3Bwc2RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNDY4MTYsImV4cCI6MjEwMTgyMjgxNn0.2Rr3byuWQLbUAp7lcWguuORS9Lc5l5nDB_-9XEitcUA';
const KEY = SERVICE_ROLE || ANON_KEY;
console.log('Using service role key:', !!SERVICE_ROLE);
if (!KEY) {
  console.error('Missing Supabase key');
  process.exit(1);
}

const ADMIN_USER_ID = 'b315d8bf-1477-4c75-9abc-57a9ae22efc9';
const TARGET = 100;
const BATCH_SIZE = 20;
const MAX_PAGES = 500;

function sqlStr(s) {
  return "'" + String(s == null ? '' : s).replace(/'/g, "''") + "'";
}

function svgEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapTitle(title) {
  const words = String(title || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > 18 && line) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line.trim());
  return lines.slice(0, 4);
}

function makeCoverSvg(title) {
  const lines = wrapTitle(title);
  const fontSize = lines.length <= 2 ? 30 : lines.length === 3 ? 24 : 20;
  const lineHeight = fontSize * 1.25;
  const startY = 300 - ((lines.length - 1) * lineHeight) / 2;
  const tspans = lines
    .map((l, i) => `<text x="300" y="${startY + i * lineHeight}" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-weight="700" fill="#D4A037" text-anchor="middle">${svgEscape(l)}</text>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="600" height="800" fill="#14335A"/>${tspans}</svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg).replace(/'/g, '%27');
}

function mapGenre(subjects) {
  if (!subjects || !subjects.length) return 'Classic';
  const lower = subjects.map((s) => s.toLowerCase());
  const pick = (kw) => lower.find((s) => s.includes(kw));
  return (
    pick('fiction') ||
    pick('poetry') || pick('poem') ||
    pick('drama') || pick('play') ||
    pick('history') ||
    pick('philosoph') ||
    pick('science') ||
    pick('adventure') ||
    pick('mystery') || pick('detective') ||
    pick('romance') ||
    pick('horror') || pick('gothic') ||
    pick('fantasy') ||
    pick('children') ||
    pick('biograph') || pick('memoir') ||
    'Classic'
  );
}

function summarize(book) {
  const authorName = book.authors && book.authors[0] ? book.authors[0].name : 'Unknown author';
  if (book.summaries && book.summaries.length) {
    return book.summaries[0];
  }
  if (book.subjects && book.subjects.length) {
    return `${book.title} — ${book.subjects.slice(0, 3).join(', ')}.`;
  }
  return `${book.title} by ${authorName}.`;
}

function extractPdf(book) {
  const fmts = book.formats || {};
  if (fmts['application/pdf']) return fmts['application/pdf'];
  if (fmts['application/octet-stream']) return fmts['application/octet-stream'];
  return null;
}

async function fetchPage(pageNum) {
  const url = `https://gutendex.com/books?sort=popular&page=${pageNum}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Page ${pageNum} failed: ${res.status}`);
  return res.json();
}

async function fetchAllBooks() {
  const collected = [];
  let page = 1;
  while (collected.length < TARGET && page <= MAX_PAGES) {
    const batch = [];
    for (let i = 0; i < BATCH_SIZE && page <= MAX_PAGES; i++, page++) {
      batch.push(page);
    }
    const results = await Promise.allSettled(batch.map((p) => fetchPage(p)));
    for (const r of results) {
      if (r.status !== 'fulfilled') {
        console.log(`  page error: ${r.reason?.message || r.reason}`);
        continue;
      }
      const json = r.value;
      for (const b of json.results || []) {
        const pdf = extractPdf(b);
        if (!pdf) continue;
        collected.push({
          title: b.title,
          description: summarize(b),
          genre: mapGenre(b.subjects),
          pdf_url: pdf,
          cover_url: makeCoverSvg(b.title),
        });
        if (collected.length >= TARGET) break;
      }
      if (collected.length >= TARGET) break;
    }
    console.log(`  scanned ${Math.min(page - 1, MAX_PAGES)} pages, collected ${collected.length} PDF books so far`);
  }
  return collected.slice(0, TARGET);
}

function buildInsertSql(books) {
  const values = books.map((b) => {
    const fields = [
      sqlStr(ADMIN_USER_ID),
      sqlStr(b.title),
      sqlStr(b.description),
      sqlStr(b.cover_url),
      sqlStr(b.pdf_url),
      sqlStr(b.genre),
      sqlStr('published'),
      false,
    ];
    return `(${fields.join(', ')})`;
  });
  return `INSERT INTO books (user_id, title, description, cover_url, pdf_url, genre, status, is_for_sale) VALUES\n${values.join(',\n')};`;
}

console.log('Starting Gutenberg import (target: 100 PDF books)...');
const books = await fetchAllBooks();
console.log(`Fetched ${books.length} books from Gutendex (with PDF)`);

if (books.length === 0) {
  console.error('No PDF books found. Aborting.');
  process.exit(1);
}

const sql = buildInsertSql(books);
const { writeFileSync } = await import('node:fs');
writeFileSync('scripts/import_gutenberg_output.sql', sql);
console.log(`Wrote SQL for ${books.length} books to scripts/import_gutenberg_output.sql`);
