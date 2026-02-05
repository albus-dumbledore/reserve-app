import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_PATH = process.env.QUOTES_OUTPUT || 'data/quotes.json';
const LIMIT = Number(process.env.QUOTES_LIMIT || 1000);

const sources = [
  {
    id: 'meditations',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    category: 'stoicism',
    url: 'https://www.gutenberg.org/ebooks/2680.txt.utf-8'
  },
  {
    id: 'enchiridion',
    title: 'The Enchiridion',
    author: 'Epictetus',
    category: 'stoicism',
    url: 'https://www.gutenberg.org/ebooks/45109.txt.utf-8'
  },
  {
    id: 'seneca-dialogues',
    title: 'Minor Dialogues of Seneca',
    author: 'Seneca',
    category: 'stoicism',
    url: 'https://www.gutenberg.org/ebooks/64576.txt.utf-8'
  },
  {
    id: 'choice-of-books',
    title: 'On the Choice of Books',
    author: 'Thomas Frognall Dibdin',
    category: 'books',
    url: 'https://www.gutenberg.org/ebooks/13435.txt.utf-8'
  },
  {
    id: 'magic-door',
    title: 'Through the Magic Door',
    author: 'Arthur Conan Doyle',
    category: 'books',
    url: 'https://www.gutenberg.org/ebooks/5317.txt.utf-8'
  },
  {
    id: 'books-and-bookmen',
    title: 'Books and Bookmen',
    author: 'Andrew Lang',
    category: 'books',
    url: 'https://www.gutenberg.org/ebooks/3256.txt.utf-8'
  },
  {
    id: 'gentle-reader',
    title: 'The Gentle Reader',
    author: 'Max Eastman',
    category: 'books',
    url: 'https://www.gutenberg.org/ebooks/38873.txt.utf-8'
  },
  {
    id: 'novel-reading',
    title: 'On the Vice of Novel Reading',
    author: 'Jane Austen',
    category: 'books',
    url: 'https://www.gutenberg.org/ebooks/24704.txt.utf-8'
  }
];

const sentenceRegex = /(?<=[.!?])\s+/g;

function stripGutenberg(text) {
  const start = text.indexOf('*** START OF');
  const end = text.indexOf('*** END OF');
  if (start !== -1 && end !== -1) {
    return text.slice(start, end);
  }
  return text;
}

function cleanSentence(sentence) {
  return sentence
    .replace(/\s+/g, ' ')
    .replace(/\[.*?\]/g, '')
    .replace(/[_*]/g, '')
    .trim();
}

function extractSentences(text) {
  return text
    .split(sentenceRegex)
    .map(cleanSentence)
    .filter((sentence) => sentence.length >= 60 && sentence.length <= 180)
    .filter((sentence) => !sentence.startsWith('CHAPTER'));
}

async function downloadText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  return response.text();
}

function pickQuotes(sentences, count) {
  const picks = [];
  const used = new Set();
  for (const sentence of sentences) {
    if (used.has(sentence)) continue;
    picks.push(sentence);
    used.add(sentence);
    if (picks.length >= count) break;
  }
  return picks;
}

async function main() {
  const perCategory = Math.floor(LIMIT / 2);
  const stoicQuotes = [];
  const bookQuotes = [];

  for (const source of sources) {
    const raw = await downloadText(source.url);
    const cleaned = stripGutenberg(raw);
    const sentences = extractSentences(cleaned);

    const target = source.category === 'stoicism' ? stoicQuotes : bookQuotes;
    target.push(
      ...sentences.map((sentence) => ({
        text: sentence,
        source: `${source.author} — ${source.title}`,
        category: source.category
      }))
    );
  }

  const stoicPicked = pickQuotes(stoicQuotes.map((q) => q.text), perCategory).map(
    (text) => ({
      text,
      source: stoicQuotes.find((q) => q.text === text)?.source || 'Stoicism',
      category: 'stoicism'
    })
  );
  const bookPicked = pickQuotes(bookQuotes.map((q) => q.text), LIMIT - perCategory).map(
    (text) => ({
      text,
      source: bookQuotes.find((q) => q.text === text)?.source || 'Books',
      category: 'books'
    })
  );

  const combined = [...stoicPicked, ...bookPicked];
  if (combined.length < LIMIT) {
    console.warn(`Only generated ${combined.length} quotes. Consider adding more sources.`);
  }

  fs.writeFileSync(path.resolve(OUTPUT_PATH), JSON.stringify(combined, null, 2));
  console.log(`Saved ${combined.length} quotes to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
