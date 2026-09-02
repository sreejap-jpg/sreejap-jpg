// One-off script: parses the free-books CSV, generates an SVG placeholder cover
// (navy #14335A bg, gold #D4A037 serif title) per book as a data URI, and emits
// SQL that inserts one book row + one chapter row per CSV line, scoped to the
// given user_id. Run with: node scripts/seed_free_books.mjs <user_id>
import { readFileSync } from 'node:fs';

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: node seed_free_books.mjs <user_id>');
  process.exit(1);
}

const csvPath = new URL('../data/kathazo-free-books-dataset.csv', import.meta.url).pathname;
const csv = readFileSync(csvPath, 'utf8');

// Minimal CSV parser: handles quoted fields with commas and escaped quotes.
function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c !== '\r') field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const rows = parseCsv(csv);
const header = rows[0];
const dataRows = rows.slice(1).filter((r) => r.length >= 6 && r[0]);

// Escape a string for use inside a SQL single-quoted literal.
function sqlStr(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

// Escape for SVG / data URI
function svgEscape(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Wrap text into up to N lines of max ~18 chars for the cover.
function wrapTitle(title) {
  const words = title.split(/\s+/);
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

const bookValues = [];
const chapterTuples = [];

dataRows.forEach((r, idx) => {
  const title = r[0];
  const description = r[1] || '';
  const genre = r[2] || '';
  const status = r[4] || 'published';
  const isForSale = r[5] === 'true';
  const cover = makeCoverSvg(title);
  bookValues.push(
    `(${sqlStr(userId)}, ${sqlStr(title)}, ${sqlStr(description)}, ${sqlStr(cover)}, ${sqlStr(genre)}, ${sqlStr(status)}, ${isForSale})`
  );
});

// We need book ids to attach chapters. Use a CTE: insert books returning ids,
// then insert chapters referencing those ids.
// Build a single SQL block.
let sql = '';
sql += `WITH inserted AS (\n`;
sql += `  INSERT INTO books (user_id, title, description, cover_url, genre, status, is_for_sale)\n`;
sql += `  VALUES\n`;
sql += bookValues.map((v) => `    ${v}`).join(',\n');
sql += `\n  RETURNING id, title\n`;
sql += `)\n`;
sql += `INSERT INTO chapters (book_id, title, body, chapter_order, status)\n`;
sql += `SELECT id, 'Chapter 1', 'Full text coming soon — added shortly.', 1, 'published' FROM inserted\n`;
sql += `RETURNING book_id;\n`;

console.log(sql);
