import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import zlib from 'node:zlib';
import readline from 'node:readline';
const WORKS_URL =
  process.env.OL_WORKS_DUMP_URL ||
  'https://openlibrary.org/data/ol_dump_works_latest.txt.gz';
const AUTHORS_URL =
  process.env.OL_AUTHORS_DUMP_URL ||
  'https://openlibrary.org/data/ol_dump_authors_latest.txt.gz';

const OUTPUT_PATH = process.env.BOOKS_OUTPUT || 'data/books.json';
const LIMIT = Number(process.env.BOOKS_LIMIT || 10000);

const TMP_DIR = 'data/tmp';
const WORKS_PATH = path.join(TMP_DIR, 'ol_dump_works_latest.txt.gz');
const AUTHORS_PATH = path.join(TMP_DIR, 'ol_dump_authors_latest.txt.gz');

const genreKeywords = {
  literary: ['literary', 'novel', 'fiction'],
  mystery: ['mystery', 'detective', 'crime', 'thriller'],
  historical: ['historical', 'history', 'victorian', 'ancient'],
  'science-fiction': ['science fiction', 'sci-fi', 'space', 'future', 'dystopia'],
  fantasy: ['fantasy', 'magic', 'myth', 'mythology'],
  romance: ['romance', 'love story', 'relationship'],
  essays: ['essay', 'essays'],
  poetry: ['poetry', 'poems', 'poem'],
  philosophy: ['philosophy', 'stoic', 'stoicism', 'ethics'],
  biography: ['biography', 'biographical'],
  memoir: ['memoir', 'autobiography'],
  travel: ['travel', 'journey', 'voyage'],
  nature: ['nature', 'environment', 'wildlife'],
  art: ['art', 'design', 'music', 'painting'],
  classics: ['classic', 'classical'],
  'short-stories': ['short stories', 'short story'],
  psychology: ['psychology', 'mind', 'behavior'],
  spirituality: ['spiritual', 'spirituality', 'religion'],
  sociology: ['society', 'sociology', 'culture'],
  history: ['history']
};

const moodKeywords = {
  quiet: ['quiet', 'stillness', 'silence'],
  reflective: ['reflect', 'reflection', 'introspective'],
  meditative: ['meditative', 'meditation', 'contemplation'],
  gentle: ['gentle', 'soft', 'tender'],
  warm: ['warm', 'heart', 'kind'],
  melancholic: ['melancholy', 'sad', 'loss'],
  hopeful: ['hope', 'optimistic'],
  curious: ['curious', 'curiosity', 'wonder'],
  adventurous: ['adventure', 'explore', 'expedition'],
  contemplative: ['contemplative', 'philosophical', 'thoughtful'],
  lyrical: ['lyrical', 'poetic', 'lyric'],
  'slow-burn': ['slow', 'gradual'],
  cozy: ['cozy', 'comfort'],
  grounded: ['grounded', 'ordinary', 'everyday'],
  expansive: ['expansive', 'epic', 'sweeping'],
  crisp: ['crisp', 'clear'],
  intimate: ['intimate', 'personal'],
  tender: ['tender', 'gentle'],
  restorative: ['restorative', 'healing'],
  elegant: ['elegant', 'refined'],
  minimal: ['minimal', 'spare']
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function download(url, dest, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) return resolve();
    ensureDir(path.dirname(dest));
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    client
      .get(
        url,
        {
          headers: {
            'User-Agent': 'reserve-mvp/1.0'
          }
        },
        (response) => {
          const status = response.statusCode || 0;
          if ([301, 302, 307, 308].includes(status)) {
            const location = response.headers.location;
            if (!location) {
              reject(new Error(`Redirect without location for ${url}`));
              return;
            }
            if (redirectCount > 5) {
              reject(new Error(`Too many redirects for ${url}`));
              return;
            }
            const nextUrl = new URL(location, url).toString();
            file.close();
            fs.unlinkSync(dest);
            download(nextUrl, dest, redirectCount + 1).then(resolve).catch(reject);
            return;
          }
          if (status !== 200) {
            reject(new Error(`Failed to download ${url} (${status})`));
            return;
          }
          response.pipe(file);
          file.on('finish', () => file.close(resolve));
        }
      )
      .on('error', reject);
  });
}

function parseDumpLine(line) {
  let idx = -1;
  let start = 0;
  const parts = [];
  for (let i = 0; i < 4; i += 1) {
    idx = line.indexOf('\t', start);
    if (idx === -1) return null;
    parts.push(line.slice(start, idx));
    start = idx + 1;
  }
  const jsonPart = line.slice(start);
  return { type: parts[0], jsonPart };
}

function normalizeText(text) {
  return text.toLowerCase();
}

function matchTags(haystack, map) {
  const tags = [];
  const text = normalizeText(haystack);
  for (const [tag, keywords] of Object.entries(map)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      tags.push(tag);
    }
  }
  return tags;
}

async function collectWorks() {
  const candidates = [];
  const authorKeys = new Set();
  let processed = 0;

  const stream = fs
    .createReadStream(WORKS_PATH)
    .pipe(zlib.createGunzip());

  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    const parsed = parseDumpLine(line);
    if (!parsed || parsed.type !== '/type/work') continue;

    let work;
    try {
      work = JSON.parse(parsed.jsonPart);
    } catch {
      continue;
    }

    const title = work.title;
    if (!title) continue;

    const subjects = Array.isArray(work.subjects) ? work.subjects : [];
    const description =
      typeof work.description === 'string'
        ? work.description
        : work.description?.value || '';

    const haystack = [title, description, ...subjects].join(' ');
    const genres = matchTags(haystack, genreKeywords);
    const moods = matchTags(haystack, moodKeywords);

    if (genres.length === 0 && moods.length === 0) continue;

    const authors = Array.isArray(work.authors) ? work.authors : [];
    const authorKey = authors[0]?.author?.key || '';
    if (authorKey) authorKeys.add(authorKey);

    candidates.push({
      id: work.key?.replace('/works/', '') || title.toLowerCase().replace(/\s+/g, '-'),
      title,
      authorKey,
      genres: genres.slice(0, 3),
      moods: moods.slice(0, 3),
      subjects: subjects.slice(0, 10),
      description: description?.slice(0, 240) || '',
      open_library_key: work.key
    });

    processed += 1;
    if (candidates.length >= LIMIT) break;
    if (processed % 50000 === 0) {
      console.log(`Processed ${processed} works, collected ${candidates.length}`);
    }
  }

  return { candidates, authorKeys };
}

async function mapAuthors(authorKeys) {
  if (authorKeys.size === 0) return new Map();

  const map = new Map();
  const needed = new Set(authorKeys);

  const stream = fs
    .createReadStream(AUTHORS_PATH)
    .pipe(zlib.createGunzip());
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    const parsed = parseDumpLine(line);
    if (!parsed || parsed.type !== '/type/author') continue;

    let author;
    try {
      author = JSON.parse(parsed.jsonPart);
    } catch {
      continue;
    }

    const key = author.key;
    if (!needed.has(key)) continue;

    if (author.name) {
      map.set(key, author.name);
      needed.delete(key);
    }

    if (needed.size === 0) break;
  }

  return map;
}

async function main() {
  ensureDir(TMP_DIR);
  console.log('Downloading Open Library dumps (if missing)...');
  await download(WORKS_URL, WORKS_PATH);
  await download(AUTHORS_URL, AUTHORS_PATH);

  console.log('Collecting works...');
  const { candidates, authorKeys } = await collectWorks();

  console.log('Mapping authors...');
  const authorMap = await mapAuthors(authorKeys);

  const books = candidates.map((candidate) => ({
    id: candidate.id,
    title: candidate.title,
    author: authorMap.get(candidate.authorKey) || 'Unknown',
    genres: candidate.genres,
    moods: candidate.moods,
    subjects: candidate.subjects,
    description: candidate.description,
    source: 'openlibrary',
    open_library_key: candidate.open_library_key
  }));

  ensureDir(path.dirname(OUTPUT_PATH));
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(books, null, 2));
  console.log(`Saved ${books.length} books to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
