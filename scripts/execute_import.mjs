// Execute the generated SQL insert by sending rows in batches to the Supabase REST API.
import { readFileSync } from 'node:fs';

const SUPABASE_URL = 'https://hbvftjlsexxbqbsppsdg.supabase.co';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhidmZ0amxzZXh4YnFic3Bwc2RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNDY4MTYsImV4cCI6MjEwMTgyMjgxNn0.2Rr3byuWQLbUAp7lcWguuORS9Lc5l5nDB_-9XEitcUA';
const KEY = SERVICE_ROLE || ANON_KEY;

const sql = readFileSync('scripts/import_gutenberg_output.sql', 'utf8');

// Parse the SQL to extract value tuples
const tuples = [];
const lines = sql.split('\n');
for (const line of lines) {
  const m = line.match(/^\((.+)\),?\s*$/);
  if (m) tuples.push(m[1]);
}
// Last line ends with ;
const lastLine = lines[lines.length - 1];
if (lastLine && !tuples.find(t => t === lastLine.replace(/;\s*$/, '').replace(/^\(/, ''))) {
  const lm = lastLine.match(/^\((.+)\);\s*$/);
  if (lm) tuples.push(lm[1]);
}

console.log(`Parsed ${tuples.length} tuples`);

// Build batch SQL and execute via the REST API's /rest/v1/rpc endpoint
// Actually, let's just send the full SQL via execute_sql equivalent - but we can't.
// Instead, insert via the books endpoint in JSON batches.

// Parse each tuple into a JSON object
function parseTuple(t) {
  // Fields: user_id, title, description, cover_url, pdf_url, genre, status, is_for_sale
  // This is tricky with SQL quoting. Let's use a simpler approach: use a regex to split on commas at top level (not inside quotes)
  const fields = [];
  let current = '';
  let inQuote = false;
  let i = 0;
  while (i < t.length) {
    const ch = t[i];
    if (ch === "'" && (i === 0 || t[i-1] !== '\\')) {
      // Check for escaped single quote ''
      if (inQuote && t[i+1] === "'") {
        current += "''";
        i += 2;
        continue;
      }
      inQuote = !inQuote;
      current += ch;
    } else if (ch === ',' && !inQuote) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
    i++;
  }
  if (current.trim()) fields.push(current.trim());

  // Now convert each field from SQL to JS value
  function sqlVal(v) {
    v = v.trim();
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === 'null') return null;
    if (v.startsWith("'") && v.endsWith("'")) {
      return v.slice(1, -1).replace(/''/g, "'");
    }
    return v;
  }

  return {
    user_id: sqlVal(fields[0]),
    title: sqlVal(fields[1]),
    description: sqlVal(fields[2]),
    cover_url: sqlVal(fields[3]),
    pdf_url: sqlVal(fields[4]),
    genre: sqlVal(fields[5]),
    status: sqlVal(fields[6]),
    is_for_sale: sqlVal(fields[7]),
  };
}

const books = tuples.map(parseTuple);
console.log(`Parsed ${books.length} book objects`);
console.log('Sample:', JSON.stringify({ title: books[0].title, genre: books[0].genre, pdf_url: books[0].pdf_url.slice(0, 60) }));

// Insert in batches of 20
const BATCH = 20;
let inserted = 0;
for (let i = 0; i < books.length; i += BATCH) {
  const chunk = books.slice(i, i + BATCH);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/books`, {
    method: 'POST',
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation,count=exact',
    },
    body: JSON.stringify(chunk),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Batch ${i}-${i + chunk.length} failed (${res.status}): ${text.slice(0, 500)}`);
    process.exit(1);
  }
  const count = res.headers.get('content-range');
  inserted += chunk.length;
  console.log(`Inserted batch ${i}-${i + chunk.length} (total: ${inserted})`);
}

console.log(`Done. Total inserted: ${inserted}`);
