// Fetches author names + PDF URLs from Gutendex for all 107 books
// Writes SQL UPDATE statements to /tmp/gutendex_updates.sql incrementally
import { readFileSync, writeFileSync, appendFileSync } from 'fs';

const raw = readFileSync('/tmp/cc-agent/69764134/.v3/persisted-tool-results/v3-session/call_377541702aa542188a15961a.txt', 'utf-8');
const start = raw.indexOf('[{');
const end = raw.lastIndexOf('}]') + 2;
const jsonStr = raw.slice(start, end).replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
const books = JSON.parse(jsonStr);

function extractPdf(book) {
  const fmts = book.formats || {};
  if (fmts['application/pdf']) return fmts['application/pdf'];
  return null;
}

function getAuthor(book) {
  if (book.authors && book.authors.length > 0) return book.authors[0].name;
  return null;
}

function findBestMatch(title, results) {
  if (!results.length) return null;
  let match = results.find(b => b.title === title);
  if (match) return match;
  const lower = title.toLowerCase();
  match = results.find(b => b.title.toLowerCase() === lower);
  if (match) return match;
  match = results.find(b => b.title.toLowerCase().startsWith(lower) || lower.startsWith(b.title.toLowerCase()));
  if (match) return match;
  match = results.find(b => b.title.toLowerCase().includes(lower) || lower.includes(b.title.toLowerCase()));
  if (match) return match;
  return results[0];
}

async function searchGutendex(title) {
  const cleanTitle = title.replace(/^The\s+/i, '').replace(/^A\s+/i, '').replace(/^An\s+/i, '');
  const url = `https://gutendex.com/books?search=${encodeURIComponent(cleanTitle)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Search failed for "${title}": ${res.status}`);
  const json = await res.json();
  return json.results || [];
}

function escapeSql(str) {
  if (!str) return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
}

// Start with empty file
writeFileSync('/tmp/gutendex_updates.sql', '-- Gutendex data update\n');

async function main() {
  let count = 0;
  const batchSize = 10;

  for (let i = 0; i < books.length; i += batchSize) {
    const batch = books.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map(async (book) => {
      const searchResults = await searchGutendex(book.title);
      const match = findBestMatch(book.title, searchResults);
      if (!match) {
        console.error(`NO MATCH: ${book.title}`);
        return null;
      }
      return {
        id: book.id,
        title: book.title,
        author: getAuthor(match),
        pdf: extractPdf(match),
        hadPdf: !!book.pdf_url,
      };
    }));

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        const { id, title, author, pdf, hadPdf } = r.value;
        const sets = [];
        if (author) sets.push(`author_name = ${escapeSql(author)}`);
        if (!hadPdf && pdf) sets.push(`pdf_url = ${escapeSql(pdf)}`);
        if (sets.length > 0) {
          const sql = `UPDATE books SET ${sets.join(', ')} WHERE id = '${id}';`;
          appendFileSync('/tmp/gutendex_updates.sql', sql + '\n');
          count++;
        }
        console.error(`OK: ${title} -> ${author || 'unknown'} | pdf: ${pdf ? 'yes' : 'no'}${hadPdf ? ' (already had)' : ''}`);
      } else if (r.status === 'rejected') {
        console.error(`ERROR: ${r.reason?.message || r.reason}`);
      }
    }
    console.error(`Progress: ${Math.min(i + batchSize, books.length)}/${books.length} (${count} updates)`);
  }
  console.error(`\nDone. Generated ${count} UPDATE statements.`);
}

main().catch(e => { console.error(e); process.exit(1); });
