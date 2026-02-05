import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_PATH = process.env.BOOKS_OUTPUT || 'data/books.json';
const LIMIT = Number(process.env.BOOKS_LIMIT || 10000);
const RATE_MS = Number(process.env.BOOKS_RATE_MS || 900);
const PAGE_SIZE = Math.min(Number(process.env.BOOKS_PAGE_SIZE || 100), 100);
const USER_AGENT =
  process.env.OPEN_LIBRARY_USER_AGENT ||
  'ReserveMVP/1.0 (contact: you@example.com)';

const TAXONOMY_PATH = 'data/taxonomy.json';
const SUBJECTS_ENV = process.env.BOOKS_SUBJECTS;

const defaultSubjects = [
  { subject: 'literature', genre: 'literary' },
  { subject: 'mystery', genre: 'mystery' },
  { subject: 'historical_fiction', genre: 'historical' },
  { subject: 'science_fiction', genre: 'science-fiction' },
  { subject: 'fantasy', genre: 'fantasy' },
  { subject: 'romance', genre: 'romance' },
  { subject: 'essays', genre: 'essays' },
  { subject: 'poetry', genre: 'poetry' },
  { subject: 'philosophy', genre: 'philosophy' },
  { subject: 'biography', genre: 'biography' },
  { subject: 'memoir', genre: 'memoir' },
  { subject: 'travel', genre: 'travel' },
  { subject: 'nature', genre: 'nature' },
  { subject: 'art', genre: 'art' },
  { subject: 'classics', genre: 'classics' },
  { subject: 'short_stories', genre: 'short-stories' },
  { subject: 'psychology', genre: 'psychology' },
  { subject: 'spirituality', genre: 'spirituality' },
  { subject: 'sociology', genre: 'sociology' },
  { subject: 'history', genre: 'history' }
];

const genreKeywords = {
  literary: ['literary', 'novel', 'fiction', 'literature'],
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

const fallbackMoods = {
  literary: ['reflective', 'elegant'],
  mystery: ['curious', 'crisp'],
  historical: ['grounded', 'contemplative'],
  'science-fiction': ['expansive', 'curious'],
  fantasy: ['adventurous', 'lyrical'],
  romance: ['warm', 'tender'],
  essays: ['reflective', 'quiet'],
  poetry: ['lyrical', 'meditative'],
  philosophy: ['contemplative', 'meditative'],
  biography: ['grounded', 'reflective'],
  memoir: ['intimate', 'gentle'],
  travel: ['adventurous', 'curious'],
  nature: ['restorative', 'quiet'],
  art: ['elegant', 'curious'],
  classics: ['reflective', 'slow-burn'],
  'short-stories': ['cozy', 'gentle'],
  psychology: ['contemplative', 'reflective'],
  spirituality: ['meditative', 'quiet'],
  sociology: ['contemplative', 'grounded'],
  history: ['grounded', 'reflective']
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function normalizeKey(key) {
  if (!key) return { id: '', open_library_key: '' };
  if (key.startsWith('/works/')) {
    return { id: key.replace('/works/', ''), open_library_key: key };
  }
  if (key.startsWith('OL')) {
    return { id: key, open_library_key: `/works/${key}` };
  }
  return { id: key, open_library_key: key };
}

async function fetchJson(url, attempt = 0) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT
    }
  });

  if (response.status === 429 || response.status >= 500) {
    if (attempt >= 3) {
      throw new Error(`Open Library API error ${response.status} for ${url}`);
    }
    const backoff = 500 * Math.pow(2, attempt);
    await delay(backoff);
    return fetchJson(url, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`Open Library API error ${response.status} for ${url}`);
  }

  return response.json();
}

function loadTaxonomy() {
  try {
    const raw = fs.readFileSync(TAXONOMY_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { genres: [], moods: [], contexts: [] };
  }
}

function resolveSubjects() {
  if (!SUBJECTS_ENV) return defaultSubjects;
  const entries = SUBJECTS_ENV.split(',').map((entry) => entry.trim()).filter(Boolean);
  if (entries.length === 0) return defaultSubjects;
  return entries.map((subject) => ({
    subject,
    genre: 'literary'
  }));
}

async function main() {
  const taxonomy = loadTaxonomy();
  const subjects = resolveSubjects();
  const perSubject = Math.ceil(LIMIT / subjects.length);

  const books = [];
  const seen = new Set();

  const fields = ['key', 'title', 'author_name', 'subject'].join(',');

  for (const subject of subjects) {
    let page = 1;
    let collected = 0;

    while (collected < perSubject && books.length < LIMIT) {
      const q = `subject:${subject.subject}`;
      const url =
        `https://openlibrary.org/search.json?` +
        `q=${encodeURIComponent(q)}` +
        `&fields=${encodeURIComponent(fields)}` +
        `&limit=${PAGE_SIZE}` +
        `&page=${page}`;

      const data = await fetchJson(url);
      const docs = Array.isArray(data.docs) ? data.docs : [];
      if (docs.length === 0) break;

      for (const doc of docs) {
        if (books.length >= LIMIT || collected >= perSubject) break;
        const title = doc.title;
        if (!title) continue;

        const { id, open_library_key } = normalizeKey(doc.key);
        if (!id || seen.has(id)) continue;

        const author = Array.isArray(doc.author_name) && doc.author_name.length > 0
          ? doc.author_name[0]
          : 'Unknown';

        const subjectsList = Array.isArray(doc.subject) ? doc.subject.slice(0, 10) : [];
        const haystack = [title, ...subjectsList].join(' ');

        const genres = new Set([
          subject.genre,
          ...matchTags(haystack, genreKeywords)
        ]);
        const moodMatches = matchTags(haystack, moodKeywords);
        const moods = moodMatches.length > 0
          ? moodMatches
          : fallbackMoods[subject.genre] || ['quiet'];

        const filteredGenres = Array.from(genres).filter((genre) =>
          taxonomy.genres?.includes(genre)
        );

        books.push({
          id,
          title,
          author,
          genres: filteredGenres.length > 0 ? filteredGenres.slice(0, 3) : ['literary'],
          moods: moods.slice(0, 3),
          subjects: subjectsList,
          description: '',
          source: 'openlibrary',
          open_library_key
        });

        seen.add(id);
        collected += 1;
      }

      page += 1;
      await delay(RATE_MS);
    }
  }

  ensureDir(path.dirname(OUTPUT_PATH));
  fs.writeFileSync(path.resolve(OUTPUT_PATH), JSON.stringify(books, null, 2));
  console.log(`Saved ${books.length} books to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
