import { NextResponse } from 'next/server';
import { filterBooksByTags, bookCatalog } from '@/lib/books';
import { getEdition } from '@/lib/edition';
import { pickConciergeResponse, resolveSuggestions } from '@/lib/concierge';
import type { ConciergeSuggestion } from '@/lib/types';
import type { ReadingContext } from '@/lib/context';

export const runtime = 'nodejs';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
const CONCIERGE_MODE =
  (process.env.CONCIERGE_MODE || 'blend').toLowerCase() as
    | 'edition'
    | 'catalog'
    | 'blend';

function buildFallback(message: string) {
  const edition = getEdition();
  const response = pickConciergeResponse(message);
  const suggestions = resolveSuggestions(response.suggestions);
  return {
    title: response.title,
    suggestions: suggestions.map((suggestion) => {
      const book = edition.books.find((item) => item.id === suggestion.bookId);
      return {
        bookId: suggestion.bookId,
        title: book?.title ?? suggestion.bookId,
        author: book?.author ?? '',
        rationale: suggestion.rationale
      };
    })
  };
}

function deriveTags(message: string) {
  const normalized = message.toLowerCase();
  const moods: string[] = [];
  const genres: string[] = [];

  // ENERGIZING/UPLIFTING needs (stuck, overwhelmed, drained)
  if (
    normalized.includes('stuck') ||
    normalized.includes('overwhelm') ||
    normalized.includes('drained') ||
    normalized.includes('burned') ||
    normalized.includes('burnout') ||
    normalized.includes('detach') ||
    normalized.includes('un-stuck') ||
    normalized.includes('unstuck') ||
    normalized.includes('energiz') ||
    normalized.includes('uplift') ||
    normalized.includes('motivat')
  ) {
    moods.push('hopeful', 'adventurous', 'curious', 'expansive');
  }

  // ANXIETY/RESTLESS needs
  if (
    normalized.includes('anxious') ||
    normalized.includes('restless') ||
    normalized.includes('nervous') ||
    normalized.includes('worry')
  ) {
    moods.push('grounded', 'restorative', 'gentle');
  }

  // LONELY/DISCONNECTED needs
  if (
    normalized.includes('lonely') ||
    normalized.includes('alone') ||
    normalized.includes('disconnect') ||
    normalized.includes('isolated')
  ) {
    moods.push('warm', 'intimate', 'tender');
  }

  // GRIEF/SADNESS needs
  if (
    normalized.includes('grief') ||
    normalized.includes('loss') ||
    normalized.includes('sad') ||
    normalized.includes('heavy heart')
  ) {
    moods.push('gentle', 'tender', 'contemplative');
  }

  // JOY/DELIGHT needs
  if (
    normalized.includes('joy') ||
    normalized.includes('delight') ||
    normalized.includes('happy') ||
    normalized.includes('uplift') ||
    normalized.includes('cheer')
  ) {
    moods.push('hopeful', 'warm', 'cozy');
  }

  // CALM/GROUNDING needs
  if (
    normalized.includes('slow') ||
    normalized.includes('ground') ||
    normalized.includes('still') ||
    normalized.includes('peace') ||
    normalized.includes('calm') ||
    normalized.includes('meditat')
  ) {
    moods.push('meditative', 'quiet', 'contemplative', 'grounded');
  }

  // FOCUS/CLARITY needs
  if (
    normalized.includes('focus') ||
    normalized.includes('clarity') ||
    normalized.includes('clear mind') ||
    normalized.includes('priorities') ||
    normalized.includes('what matters') ||
    normalized.includes('distract') ||
    normalized.includes('scattered') ||
    normalized.includes('attention')
  ) {
    moods.push('focused', 'grounded', 'contemplative', 'quiet');
    genres.push('philosophy', 'essays');
  }

  // CHILDREN/KIDS/FAMILY content
  if (
    normalized.includes('kid') ||
    normalized.includes('child') ||
    normalized.includes('young') ||
    normalized.includes('family') ||
    normalized.includes('age appropriate')
  ) {
    genres.push('childrens', 'young-adult', 'middle-grade');
    moods.push('warm', 'hopeful', 'gentle');
  }

  // INDIAN CONTEXT
  if (
    normalized.includes('india') ||
    normalized.includes('indian') ||
    normalized.includes('diwali') ||
    normalized.includes('holi') ||
    normalized.includes('monsoon') ||
    normalized.includes('delhi') ||
    normalized.includes('mumbai') ||
    normalized.includes('bengal')
  ) {
    genres.push('indian-literature', 'south-asian');
  }

  // LIGHT/GENTLE requests
  if (normalized.includes('light') || normalized.includes('gentle')) {
    moods.push('gentle', 'hopeful', 'warm');
  }

  // DEEP/CHALLENGING requests
  if (
    normalized.includes('deep') ||
    normalized.includes('dense') ||
    normalized.includes('challeng') ||
    normalized.includes('profound')
  ) {
    moods.push('contemplative', 'reflective', 'expansive');
  }

  // COMFORT needs
  if (normalized.includes('comfort') || normalized.includes('cozy')) {
    moods.push('cozy', 'warm', 'restorative');
  }

  // Explicit mood keywords
  if (normalized.includes('quiet')) moods.push('quiet');
  if (normalized.includes('warm')) moods.push('warm');
  if (normalized.includes('adventurous') || normalized.includes('adventure')) {
    moods.push('adventurous', 'expansive');
  }

  // GENRES
  if (normalized.includes('travel')) genres.push('travel');
  if (normalized.includes('poetry') || normalized.includes('poem')) genres.push('poetry');
  if (normalized.includes('mystery') || normalized.includes('detective')) genres.push('mystery');
  if (normalized.includes('history') || normalized.includes('historical')) genres.push('history', 'historical');
  if (normalized.includes('philosophy') || normalized.includes('stoic')) genres.push('philosophy');
  if (normalized.includes('romance') || normalized.includes('love story')) genres.push('romance');
  if (normalized.includes('fantasy') || normalized.includes('magical')) genres.push('fantasy');
  if (normalized.includes('science') || normalized.includes('sci-fi') || normalized.includes('scifi')) {
    genres.push('science-fiction');
  }
  if (normalized.includes('essay')) genres.push('essays');
  if (normalized.includes('memoir') || normalized.includes('autobiography')) genres.push('memoir', 'biography');
  if (normalized.includes('nature') || normalized.includes('outdoors')) genres.push('nature');
  if (normalized.includes('short stor')) genres.push('short-stories');
  if (normalized.includes('classic')) genres.push('classics');
  if (normalized.includes('literary') || normalized.includes('literature')) genres.push('literary');

  return { moods, genres };
}

function editionCandidates() {
  const edition = getEdition();
  return edition.books.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    genres: [],
    moods: [],
    subjects: [],
    description: book.why_this_book,
    source: 'openlibrary' as const,
    open_library_key: book.id
  }));
}

function candidateSet(message: string) {
  const edition = getEdition();
  const tags = deriveTags(message);

  const filtered = filterBooksByTags({
    genres: tags.genres,
    moods: tags.moods,
    query: message,
    limit: 120
  });

  if (CONCIERGE_MODE === 'edition') {
    return editionCandidates();
  }

  if (CONCIERGE_MODE === 'catalog') {
    if (filtered.length > 0) return filtered;
    return bookCatalog.length > 0 ? bookCatalog.slice(0, 40) : editionCandidates();
  }

  // In blend mode, prioritize filtered catalog books when available
  // This gives more variety than always starting with the same 7 edition books
  const catalogBooks = filtered.length > 0 ? filtered : bookCatalog.slice(0, 60);

  const blend = [
    ...catalogBooks,
    ...editionCandidates()
  ];

  return blend.length > 0 ? blend : editionCandidates();
}

function mapSuggestions(
  candidates: ReturnType<typeof candidateSet>,
  suggestions: { bookId: string; rationale: string }[]
): ConciergeSuggestion[] {
  const byId = new Map(candidates.map((book) => [book.id, book] as const));
  const mapped = suggestions
    .map((suggestion) => {
      const book = byId.get(suggestion.bookId);
      if (!book) return null;
      return {
        bookId: book.id,
        title: book.title,
        author: book.author,
        rationale: suggestion.rationale
      } as ConciergeSuggestion;
    })
    .filter(Boolean) as ConciergeSuggestion[];
  if (mapped.length > 0) return mapped;
  return candidates.slice(0, 3).map((book) => ({
    bookId: book.id,
    title: book.title,
    author: book.author,
    rationale: 'Chosen for a calm fit with your request.'
  }));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = String(body?.message || '').trim();
    const excludeBookIds = Array.isArray(body?.excludeBookIds)
      ? body.excludeBookIds.map((id: unknown) => String(id))
      : [];
    const context = body?.context as ReadingContext | undefined;

    if (!message) {
      return NextResponse.json({ error: 'Message required.' }, { status: 400 });
    }

    // Check if request is for children/kids (including age-specific requests)
    const messageLower = message.toLowerCase();
    const ageMatch = messageLower.match(/(\d+)[\s-]?year[\s-]?old/);
    const requestedAge = ageMatch ? parseInt(ageMatch[1]) : null;
    const isChildrensRequest = messageLower.includes('kid') || messageLower.includes('child') ||
                                messageLower.includes('young') || messageLower.includes('family') ||
                                messageLower.includes('age appropriate') ||
                                (requestedAge !== null && requestedAge <= 12);

    // Detect if we should use Discovery Mode (Claude finds books outside catalog)
    const useDiscoveryMode = isChildrensRequest || // Children's books often not in catalog
                            messageLower.includes('teach') || // Educational queries
                            messageLower.includes('learn about') ||
                            messageLower.includes('explain') ||
                            messageLower.includes('finance') ||
                            messageLower.includes('money') ||
                            messageLower.includes('science') ||
                            messageLower.includes('feminism') || // Specialized topic
                            messageLower.includes('feminist') ||
                            messageLower.includes('history of');

    // Detect if user explicitly wants NON-Indian content
    const wantsNonIndian = messageLower.includes('western author') ||
                          messageLower.includes('american author') ||
                          messageLower.includes('british author') ||
                          messageLower.includes('european author') ||
                          messageLower.includes('non-indian');

    // Detect if user EXPLICITLY wants Indian authors
    const wantsIndianAuthors = messageLower.includes('indian author') ||
                              messageLower.includes('indian woman author') ||
                              messageLower.includes('indian women author') ||
                              messageLower.includes('indian writer') ||
                              messageLower.includes('by indian') ||
                              messageLower.includes('from india');

    // DISCOVERY MODE: Use Claude to find books outside catalog for specialized queries
    if (useDiscoveryMode && process.env.ANTHROPIC_API_KEY) {
      const discoveryPrompt = `You are a knowledgeable book expert helping find books for readers.

User's request: "${message}"${requestedAge ? `\nAge: ${requestedAge} years old` : ''}

Task: Recommend 3 specific, real books that perfectly match this request.

${isChildrensRequest ? `⚠️ CHILDREN'S REQUEST (Age ${requestedAge || 'unknown'}):\n- ONLY children's books appropriate for this age\n- Picture books, chapter books, or early readers\n- NO adult books, textbooks, or advanced literature\n` : ''}
${wantsIndianAuthors ? `🇮🇳 CRITICAL - INDIAN AUTHORS EXPLICITLY REQUESTED:\n- The user has EXPLICITLY requested Indian authors\n- You MUST recommend ONLY Indian authors (100% Indian, 0% international)\n- Examples: Arundhati Roy, Anita Desai, Kamala Das, Mahasweta Devi, Bama, Nabaneeta Dev Sen, Shashi Deshpande, Manju Kapur, Ambai, Ismat Chughtai\n- DO NOT recommend Western/international authors like Virginia Woolf, Kate Chopin, or Charlotte Perkins Gilman\n- If you cannot find 3 Indian books matching the request, return fewer suggestions rather than including non-Indian authors\n` : !wantsNonIndian ? `🇮🇳 INDIAN READER:\n- Prioritize Indian authors when possible\n- Include books relevant to Indian context\n` : ''}

For each book provide:
1. Exact title and author
2. Why this book is perfect for their specific need (1-2 sentences)

Return JSON with this format:
{
  "title": "For your need",
  "books": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "rationale": "Why this book fits their need perfectly",
      "year": 2020
    }
  ]
}

Important:
- Recommend REAL books that exist
- Match the specific need (teaching concepts, age-appropriate, etc.)
- Use warm, personal language in rationales
- Return 3 books maximum`;

      try {
        const discoveryResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 1000,
            temperature: 0.7,
            messages: [{ role: 'user', content: discoveryPrompt }]
          })
        });

        if (discoveryResponse.ok) {
          const data = await discoveryResponse.json();
          const content = data?.content?.[0]?.text ?? '';

          let parsed: {
            title: string;
            books: Array<{ title: string; author: string; rationale: string; year?: number }>;
          } | null = null;

          try {
            // Try direct JSON parse first
            parsed = JSON.parse(content);
          } catch (parseError) {
            // If that fails, try to extract JSON object from text
            try {
              const jsonMatch = content.match(/\{[\s\S]*"books"[\s\S]*\]/);
              if (jsonMatch) {
                // Find the complete JSON object
                let braceCount = 0;
                let startIdx = jsonMatch.index!;
                let endIdx = startIdx;
                for (let i = startIdx; i < content.length; i++) {
                  if (content[i] === '{') braceCount++;
                  if (content[i] === '}') braceCount--;
                  if (braceCount === 0) {
                    endIdx = i + 1;
                    break;
                  }
                }
                const jsonStr = content.substring(startIdx, endIdx);
                parsed = JSON.parse(jsonStr);
              } else {
                console.error('Discovery mode: Failed to find JSON object in response');
                parsed = null;
              }
            } catch (extractError) {
              console.error('Discovery mode parse error:', parseError);
              parsed = null;
            }
          }

          try {
            if (parsed && parsed.books && Array.isArray(parsed.books)) {
              // Convert to concierge format
              let suggestions = parsed.books.map((book) => ({
                bookId: `discovered-${book.title.toLowerCase().replace(/\s+/g, '-')}`,
                title: book.title,
                author: book.author,
                rationale: book.rationale
              }));

              // POST-PROCESSING: Enforce Indian author constraints for Discovery Mode
              if (wantsIndianAuthors) {
                const indianAuthors = [
                  'r.k. narayan', 'r k narayan', 'ruskin bond', 'amitav ghosh',
                  'arundhati roy', 'jhumpa lahiri', 'vikram seth', 'anita desai',
                  'salman rushdie', 'rohinton mistry', 'kiran desai', 'aravind adiga',
                  'shashi tharoor', 'premchand', 'tagore', 'rabindranath tagore',
                  'mulk raj anand', 'r.k. laxman', 'chetan bhagat', 'amish tripathi',
                  'devdutt pattanaik', 'sudha murty', 'manu s pillai', 'shobhaa de',
                  'anuja chauhan', 'anuradha roy', 'manju kapur', 'bharati mukherjee',
                  'vaikom muhammad basheer', 'kamala das', 'o.v. vijayan',
                  'mahasweta devi', 'nirmal verma', 'u.r. ananthamurthy',
                  'girish karnad', 'shyam selvadurai', 'nayantara sahgal',
                  'jawaharlal nehru', 'abul kalam azad', 'khushwant singh',
                  'william dalrymple', 'ramachandra guha', 'amartya sen',
                  'shashi deshpande', 'bama', 'nabaneeta dev sen', 'ambai', 'ismat chughtai'
                ];

                const isIndianAuthor = (author: string) => {
                  const authorLower = author.toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
                  return indianAuthors.some(name => {
                    const nameLower = name.toLowerCase()
                      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    return authorLower.includes(nameLower);
                  });
                };

                // Filter to keep only Indian authors
                suggestions = suggestions.filter(s => isIndianAuthor(s.author));
              }

              return NextResponse.json({
                title: parsed.title || 'Handpicked for you',
                suggestions,
                discoveryMode: true
              });
            }
          } catch (parseError) {
            console.error('Discovery mode parse error:', parseError);
          }
        }
      } catch (discoveryError) {
        console.error('Discovery mode error:', discoveryError);
      }
    }

    // CATALOG MODE: Fall back to catalog-based recommendations
    let candidates = candidateSet(message);

    // Indian author prioritization logic
    if (!wantsNonIndian) {
      const indianAuthors = [
        // Classic Indian authors
        'r.k. narayan', 'r k narayan', 'ruskin bond', 'amitav ghosh',
        'arundhati roy', 'jhumpa lahiri', 'vikram seth', 'anita desai',
        'salman rushdie', 'rohinton mistry', 'kiran desai', 'aravind adiga',
        'shashi tharoor', 'premchand', 'tagore', 'rabindranath tagore',
        'mulk raj anand', 'r.k. laxman',
        // Contemporary Indian authors
        'chetan bhagat', 'amish tripathi', 'devdutt pattanaik',
        'sudha murty', 'manu s pillai', 'shobhaa de', 'anuja chauhan',
        'anuradha roy', 'manju kapur', 'bharati mukherjee',
        // Regional Indian authors
        'vaikom muhammad basheer', 'kamala das', 'o.v. vijayan',
        'mahasweta devi', 'nirmal verma', 'u.r. ananthamurthy',
        'girish karnad', 'shyam selvadurai', 'nayantara sahgal',
        // Ancient/classical Indian authors
        'valmiki', 'vālmīki', 'vatsyayana', 'vatsyāyana', 'kalidasa', 'kālidāsa',
        // Indian historians/non-fiction
        'jawaharlal nehru', 'ramachandra guha', 'amartya sen', 'khushwant singh',
        // Indian women authors
        'shashi deshpande', 'bama', 'nabaneeta dev sen', 'ambai', 'ismat chughtai',
        'abul kalam azad'
      ];

      // Separate Indian and non-Indian authors
      const indianBooks: typeof candidates = [];
      const otherBooks: typeof candidates = [];

      candidates.forEach(book => {
        const authorLower = book.author.toLowerCase();
        const titleLower = book.title.toLowerCase();
        const isIndianAuthor = indianAuthors.some(name => authorLower.includes(name));
        const isAboutIndia = titleLower.includes('india') || titleLower.includes('delhi') ||
                            titleLower.includes('mumbai') || titleLower.includes('bengal') ||
                            titleLower.includes('malgudi') || titleLower.includes('calcutta') ||
                            titleLower.includes('kolkata') || titleLower.includes('chennai');

        if (isIndianAuthor || isAboutIndia) {
          indianBooks.push(book);
        } else {
          otherBooks.push(book);
        }
      });

      // If user EXPLICITLY requested Indian authors, provide ONLY Indian books
      if (wantsIndianAuthors) {
        candidates = indianBooks;
        console.log(`[Indian Priority] Explicit request - providing ${candidates.length} Indian books only`);
      } else {
        // Otherwise, balanced representation: 50% Indian authors, 50% international
        // Ensure we have minimum 20 Indian books in candidate pool for balance
        const minIndianBooks = 20;
        let expandedIndianBooks = indianBooks;

        if (indianBooks.length < minIndianBooks) {
          // Add more Indian books from full catalog (not just mood-matched ones)
          const allIndianBooks = bookCatalog.filter(c => {
            const authorLower = c.author.toLowerCase();
            const isIndian = indianAuthors.some(name => authorLower.includes(name));
            // Don't add duplicates
            const notAlreadyIncluded = !indianBooks.some(existing => existing.id === c.id);
            return isIndian && notAlreadyIncluded;
          });
          expandedIndianBooks = [...indianBooks, ...allIndianBooks].slice(0, Math.max(minIndianBooks, indianBooks.length));
        }

        // Now create 50/50 balanced candidate list
        const totalCandidates = Math.max(candidates.length, 40);
        const halfCount = Math.floor(totalCandidates / 2);

        candidates = [
          ...expandedIndianBooks.slice(0, halfCount),
          ...otherBooks.slice(0, halfCount)
        ];

        console.log(`[Indian Priority] Balanced mode - ${expandedIndianBooks.slice(0, halfCount).length} Indian + ${otherBooks.slice(0, halfCount).length} international = ${candidates.length} total (expanded ${indianBooks.length}→${expandedIndianBooks.length} Indian books)`);
      }
    }

    // Filter out inappropriate content for children's requests
    if (isChildrensRequest) {
      const inappropriateKeywords = [
        // Adult content
        'kama sutra', 'kamasutra', 'erotic', 'adult', 'mature', 'explicit', 'sex',
        // Academic/Advanced texts not suitable for children
        'anthology', 'essays', 'grammar', 'philosophy', 'critique', 'theory',
        'norton', 'oxford companion', 'encyclopedia', 'dictionary', 'handbook',
        'montaigne', 'nietzsche', 'kafka', 'joyce', 'woolf',
        // Complex literary works
        'ulysses', 'finnegans wake', 'being and time', 'capital'
      ];

      candidates = candidates.filter((book) => {
        const bookTitle = book.title.toLowerCase();
        const bookAuthor = book.author.toLowerCase();
        const bookDesc = (book.description || '').toLowerCase();
        const combinedText = `${bookTitle} ${bookAuthor} ${bookDesc}`;

        // Exclude if it matches inappropriate keywords
        if (inappropriateKeywords.some(keyword => combinedText.includes(keyword))) {
          return false;
        }

        // For very young children (under 8), be even more strict
        if (requestedAge !== null && requestedAge < 8) {
          // Exclude books with "Volume", "Part", suggesting academic series
          if (bookTitle.includes('volume') || bookTitle.includes('part i')) {
            return false;
          }
        }

        return true;
      });
    }

    if (excludeBookIds.length > 0) {
      candidates = candidates.filter((book) => !excludeBookIds.includes(book.id));
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      const fallback = buildFallback(message);
      return NextResponse.json({
        title: fallback.title,
        suggestions: fallback.suggestions
      });
    }

    const contextInfo = context
      ? `\n\nCurrent Reading Context:\n- Location: ${context.location || 'Not specified'}\n- Season: ${context.season}\n- Time of Day: ${context.timeOfDay}${context.weather ? `\n- Weather: ${context.weather.condition}, ${context.weather.temp}°C` : ''}\n- Reading Mood: ${context.readingMood}${!wantsNonIndian ? '\n- Cultural Context: Indian reader - prioritize Indian authors, settings, and cultural sensibilities' : ''}\n\nUSE THIS CONTEXT: Factor in the weather, season, and time of day when making recommendations. ${context.weather?.condition.includes('Rain') ? 'Rainy weather pairs well with cozy, introspective reads.' : context.weather?.condition.includes('Sun') || context.weather?.condition.includes('Clear') ? 'Clear weather invites bright, energizing books.' : context.season === 'Winter' ? 'Winter calls for contemplative, intimate reads.' : context.season === 'Summer' ? 'Summer energy suits lighter, adventurous books.' : ''}${!wantsNonIndian ? ' For Indian readers, actively prioritize books by Indian authors, books set in India, or themes relevant to Indian culture.' : ''}`
      : '';

    const prompt = `You are a deeply perceptive literary concierge for a physical-book reading room. Your gift is understanding what readers truly need emotionally, contextually, and intellectually.${isChildrensRequest ? `\n\n⚠️ CRITICAL CONTENT SAFETY - ${requestedAge ? `AGE ${requestedAge}` : 'CHILDREN\'S'} REQUEST:\nYou MUST:\n- ONLY recommend books specifically written for ${requestedAge ? `${requestedAge}-year-olds` : 'children'}\n- NO academic texts, anthologies, grammar books, or advanced literature\n- NO adult authors like Virginia Woolf, Montaigne, Kafka, Joyce\n- ONLY children's books, picture books, early readers, or age-appropriate stories\n- Examples of GOOD suggestions: ${requestedAge && requestedAge <= 8 ? 'Picture books, Dr. Seuss, Eric Carle, simple stories with illustrations' : 'Young adult novels, chapter books, age-appropriate fiction'}\n- Examples of BAD suggestions: Norton Anthology, Essays, Grammar textbooks, Classic literature not written for children` : ''}${wantsIndianAuthors ? '\n\n🇮🇳 CRITICAL - INDIAN AUTHORS EXPLICITLY REQUESTED:\nYou MUST recommend ONLY books by Indian authors (100% Indian):\n- REQUIRED: All suggestions must be Indian authors\n- Examples: R.K. Narayan, Ruskin Bond, Amitav Ghosh, Arundhati Roy, Jhumpa Lahiri, Vikram Seth, Anita Desai, Salman Rushdie, Rohinton Mistry, Kiran Desai, Aravind Adiga, Sudha Murty, Devdutt Pattanaik, Shashi Tharoor, Kamala Das, Mahasweta Devi\n- DO NOT recommend any Western/international authors\n- The candidate list has been filtered to ONLY Indian authors' : !wantsNonIndian ? '\n\n🇮🇳 INDIAN READER - BALANCED REPRESENTATION:\nYou MUST maintain 50/50 balance in your 3 selections:\n- REQUIRED: Select EXACTLY 1-2 Indian authors AND 1-2 international authors (NOT all Indian, NOT all international)\n- For 3 suggestions: 2 Indian + 1 international OR 1 Indian + 2 international\n- The candidate list has Indian and international authors available\n- Indian authors include: R.K. Narayan, Ruskin Bond, Amitav Ghosh, Arundhati Roy, Jhumpa Lahiri, Vikram Seth, Anita Desai, Salman Rushdie, Rohinton Mistry, Kiran Desai, Aravind Adiga, Sudha Murty, Devdutt Pattanaik\n- CRITICAL: Mix Indian AND international authors in your selections - do NOT select only one group\n- Choose based on best fit for the request, but maintain the balance requirement' : ''}

ANALYZE THE REQUEST FIRST:

User's request: "${message}"${excludeBookIds.length > 0 ? `\n\nNote: User is asking for MORE suggestions (beyond the ${excludeBookIds.length} books already suggested). Provide different books that also match their need.` : ''}${contextInfo}

1. EMOTIONAL STATE - What are they feeling?
   - Stuck/Overwhelmed/Burned out → Need: Energizing, accessible books with forward momentum (NOT contemplative/slow)
   - Anxious/Restless → Need: Immersive escape OR gentle grounding depending on tone
   - Lonely/Disconnected → Need: Warm books with strong human connection and intimacy
   - Grieving/Heavy heart → Need: Gentle wisdom that sits with sadness, not "fix-it" books
   - Drained/Exhausted → Need: Light, replenishing reads; avoid demanding books
   - Need confidence/motivation → Need: Quiet courage, resilience without toxic positivity
   - Seeking joy/delight → Need: Playful, life-affirming, delightful books
   - Scattered/Distracted/Need focus → Need: Books about essentialism, clarity, priorities; philosophical essays on what matters
   - Want clarity/perspective → Need: Wisdom literature, philosophical essays, contemplative non-fiction

2. LIFE CONTEXT - What's happening in their life?
   - New parent/caregiver → Short sessions, life-affirming, easy to pick up/put down
   - Career change/transition → Stories of reinvention, finding purpose, change
   - Dealing with loss → Avoid cheerfulness; offer presence and gentle wisdom
   - Travel/vacation → Place-based immersion, atmospheric escape
   - Weekend vs commute → Session length and intensity matter
   - Seasonal mood → Winter coziness, summer lightness, autumn reflection

3. READING INTENTION - Why are they reading?
   - ESCAPE: Completely immersive, transporting, forget-the-world
   - LEARN: Accessible entry points for curiosity (not academic/dense)
   - COMFORT: Familiar patterns, warmth, gentle reassurance
   - CHALLENGE: Dense, rewarding, slow attention required
   - INSPIRE: Creativity, possibility, opening horizons
   - CONNECT: Deep human stories, emotional intimacy
   - GROUND: Quiet, meditative, finding stillness

4. SMART AVOIDANCE - What to skip?
   - "Light" requested → Avoid heavy/tragic/dense/dark
   - "Overwhelmed" → Avoid philosophical/abstract/demanding
   - "Quick" → Avoid multi-volume epics or challenging prose
   - "Gentle" → Avoid violence/harshness/cynicism
   - "Energizing" → Avoid slow/contemplative/melancholic
   - "Focus" → Avoid fragmented/experimental structure

5. MATCH ACCESSIBILITY TO ENERGY LEVEL
   - Low energy/overwhelmed → Highly accessible, clear prose, engaging
   - High curiosity/excited → Can handle more complexity
   - Fragmented time → Short chapters, episodic structure
   - Deep focus available → Reward sustained attention

RECOMMENDATION STRATEGY:

- Match emotional remedy to actual need (not surface request)
- Consider life constraints and context
- Write rationales that show you understand their situation
- Use warm, personal language: "When you're feeling X, this offers Y"
- Suggest 2-3 books with DISTINCT approaches to their need
- IMPORTANT: Prioritize VARIETY - choose books with different authors, genres, and tones
- If the user has asked multiple questions, try to suggest DIFFERENT books each time, not the same ones
- Mix well-known and lesser-known books when possible

Only recommend physical books from the provided candidate list. Do not mention ebooks, summaries, or reading in-app.

Return JSON only with shape: {"title": string, "suggestions": [{"bookId": string, "rationale": string}]}

The title should be 3-6 words that capture what you're offering (e.g., "For that overwhelmed feeling", "When you need companionship", "Gentle energy and light").

Rationales should be personal and show understanding: "When focus is scattered, this absorbs gently" or "For a heavy heart, this sits with you quietly" not generic "You might enjoy this."

Candidates:\n${candidates
      .map(
        (book) =>
          `- ${book.id} | ${book.title} — ${book.author} | genres: ${
            book.genres.join(', ') || 'n/a'
          } | moods: ${book.moods.join(', ') || 'n/a'} | ${book.description ?? ''}`
      )
      .join('\n')}`;

    let response: Response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1500,
          temperature: 0.9,
          messages: [
            {
              role: 'user',
              content: `You are a deeply perceptive literary concierge with exceptional emotional intelligence. You understand what readers truly need based on their emotional state, life context, and reading intentions - not just their surface request.

Your superpower: matching the right book to the right moment in someone's life. A person feeling "stuck" needs energizing momentum, not more contemplation. Someone lonely needs warm human connection. Someone grieving needs gentle presence, not solutions.

Analyze deeply. Recommend thoughtfully. Write rationales that show you truly understand their moment.

${prompt}`
            }
          ]
        })
      });
    } catch {
      const fallback = buildFallback(message);
      return NextResponse.json({
        title: fallback.title,
        suggestions: fallback.suggestions
      });
    }

    if (!response.ok) {
      const fallback = buildFallback(message);
      return NextResponse.json({
        title: fallback.title,
        suggestions: fallback.suggestions
      });
    }

    const data = await response.json();
    const content = data?.content?.[0]?.text ?? '';
    let parsed: { title: string; suggestions: { bookId: string; rationale: string }[] } | null = null;

    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = null;
    }

    if (!parsed || !Array.isArray(parsed.suggestions)) {
      const fallback = buildFallback(message);
      return NextResponse.json({
        title: fallback.title,
        suggestions: fallback.suggestions
      });
    }

    // Map AI suggestions to actual book objects
    let finalSuggestions = mapSuggestions(candidates, parsed.suggestions);

    console.log(`[Concierge] Total candidates: ${candidates.length}, Final suggestions: ${finalSuggestions.length}`);

    // POST-PROCESSING: Enforce Indian author constraints
    if (!wantsNonIndian && finalSuggestions.length > 0) {
      const indianAuthors = [
        'r.k. narayan', 'r k narayan', 'ruskin bond', 'amitav ghosh',
        'arundhati roy', 'jhumpa lahiri', 'vikram seth', 'anita desai',
        'salman rushdie', 'rohinton mistry', 'kiran desai', 'aravind adiga',
        'shashi tharoor', 'premchand', 'tagore', 'rabindranath tagore',
        'mulk raj anand', 'r.k. laxman', 'chetan bhagat', 'amish tripathi',
        'devdutt pattanaik', 'sudha murty', 'manu s pillai', 'shobhaa de',
        'anuja chauhan', 'anuradha roy', 'manju kapur', 'bharati mukherjee',
        'vaikom muhammad basheer', 'kamala das', 'o.v. vijayan',
        'mahasweta devi', 'nirmal verma', 'u.r. ananthamurthy',
        'girish karnad', 'shyam selvadurai', 'nayantara sahgal',
        'valmiki', 'vālmīki', 'vatsyayana', 'vatsyāyana', 'kalidasa', 'kālidāsa',
        'jawaharlal nehru', 'ramachandra guha', 'amartya sen', 'khushwant singh',
        'shashi deshpande', 'bama', 'nabaneeta dev sen', 'ambai', 'ismat chughtai',
        'abul kalam azad'
      ];

      const isIndianAuthor = (author: string) => {
        const authorLower = author.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
        return indianAuthors.some(name => {
          const nameLower = name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          // Use word boundary matching to avoid false positives like "Barack Obama" matching "bama"
          const regex = new RegExp('\\b' + nameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
          return regex.test(authorLower);
        });
      };

      // If user explicitly requested Indian authors, filter out non-Indian ones
      if (wantsIndianAuthors) {
        finalSuggestions = finalSuggestions.filter(s => isIndianAuthor(s.author));
      } else {
        // Otherwise, enforce 50% balance - exactly 1 or 2 Indian authors in 3 suggestions
        const indianSuggestions = finalSuggestions.filter(s => isIndianAuthor(s.author));
        const nonIndianSuggestions = finalSuggestions.filter(s => !isIndianAuthor(s.author));
        const targetIndianCount = Math.ceil(finalSuggestions.length * 0.5); // For 3 suggestions = 2
        const targetNonIndianCount = finalSuggestions.length - targetIndianCount; // For 3 suggestions = 1

        console.log(`[Balance Check] Current: ${indianSuggestions.length} Indian + ${nonIndianSuggestions.length} non-Indian, Target: ${targetIndianCount} Indian + ${targetNonIndianCount} non-Indian`);

        // Enforce exact balance by swapping if needed
        if (indianSuggestions.length > targetIndianCount) {
          // Too many Indian - replace excess with non-Indian from candidates
          const excessIndian = indianSuggestions.slice(targetIndianCount);
          const nonIndianCandidates = candidates.filter(c =>
            !isIndianAuthor(c.author) &&
            !finalSuggestions.some(s => s.bookId === c.id)
          );

          if (nonIndianCandidates.length >= excessIndian.length) {
            const replacements = nonIndianCandidates.slice(0, excessIndian.length).map(book => ({
              bookId: book.id,
              title: book.title,
              author: book.author,
              rationale: 'A thoughtful choice that complements your request.'
            }));

            finalSuggestions = [
              ...indianSuggestions.slice(0, targetIndianCount),
              ...nonIndianSuggestions,
              ...replacements
            ];
            console.log(`[Balance Enforcement] Replaced ${excessIndian.length} excess Indian (${excessIndian.map(s => s.author).join(', ')}) with non-Indian (${replacements.map(r => r.author).join(', ')})`);
          }
        } else if (indianSuggestions.length < targetIndianCount) {
          // Too few Indian - replace non-Indian with Indian from candidates
          const needed = targetIndianCount - indianSuggestions.length;
          const indianCandidates = candidates.filter(c =>
            isIndianAuthor(c.author) &&
            !finalSuggestions.some(s => s.bookId === c.id)
          );

          if (indianCandidates.length >= needed) {
            const replacements = indianCandidates.slice(0, needed).map(book => ({
              bookId: book.id,
              title: book.title,
              author: book.author,
              rationale: 'A thoughtful choice that resonates with your request.'
            }));

            finalSuggestions = [
              ...indianSuggestions,
              ...nonIndianSuggestions.slice(0, targetNonIndianCount),
              ...replacements
            ];
            console.log(`[Balance Enforcement] Added ${needed} Indian (${replacements.map(r => r.author).join(', ')}) to meet target`);
          }
        }
      }
    }

    return NextResponse.json({
      title: parsed.title || 'A few quiet suggestions',
      suggestions: finalSuggestions
    });
  } catch (error) {
    return NextResponse.json({ error: 'Concierge unavailable.' }, { status: 500 });
  }
}
