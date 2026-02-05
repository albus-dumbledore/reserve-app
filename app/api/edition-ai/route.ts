import { NextResponse } from 'next/server';
import { bookCatalog } from '@/lib/books';
import type { EditionBook } from '@/lib/types';
import type { ReadingContext } from '@/lib/context';

export const runtime = 'nodejs';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

interface AIEditionResponse {
  theme: string;
  description: string;
  books: EditionBook[];
  month: string;
}

function getMonthKey() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function getMonthName() {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const context = body?.context as ReadingContext | undefined;
    const cachedEdition = body?.cachedEdition as AIEditionResponse | null;
    const currentMonth = getMonthKey();

    // Return cached edition if it's from the current month
    if (cachedEdition && cachedEdition.month === currentMonth) {
      return NextResponse.json(cachedEdition);
    }

    // Indian author detection
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
      'girish karnad', 'shyam selvadurai', 'nayantara sahgal', 'vālmīki',
      'vatsyāyana', 'kalidasa', 'tulsidas', 'kabir', 'mirabai'
    ];

    const isIndianAuthor = (authorName: string) => {
      const authorLower = authorName.toLowerCase();
      return indianAuthors.some(name => authorLower.includes(name));
    };

    // Prepare book catalog with Indian author priority
    const validBooks = bookCatalog.filter(book => book.title && book.author);
    const indianBooks = validBooks.filter(book => isIndianAuthor(book.author));
    const internationalBooks = validBooks.filter(book => !isIndianAuthor(book.author));

    // Create sample: 50 Indian + 50 International = 100 books (balanced)
    const catalogSample = [
      ...indianBooks.slice(0, 50),
      ...internationalBooks.slice(0, 50)
    ].map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      genres: book.genres.slice(0, 2),
      moods: book.moods.slice(0, 2)
    }));

    // Build context prompt
    const contextPrompt = context
      ? `
Current Context:
- Month: ${getMonthName()}
- Season: ${context.season}
- Time of Day: ${context.timeOfDay}
${context.weather ? `- Weather: ${context.weather.condition}, ${context.weather.temp}°C` : ''}
${context.location ? `- Location: ${context.location}` : ''}
- Reading Mood: ${context.readingMood}
`
      : `
Current Context:
- Month: ${getMonthName()}
`;

    const prompt = `You are curating this month's reading edition for Reserve, a mindful reading app focused on physical books and slow, intentional reading.

${contextPrompt}

🇮🇳 INDIAN READER - BALANCED CURATION:
- Aim for a balanced selection with approximately 10 Indian authors out of 20 books (around 50%)
- Indian authors include: R.K. Narayan, Ruskin Bond, Amitav Ghosh, Arundhati Roy, Jhumpa Lahiri, Vikram Seth, Tagore, Premchand, Sudha Murty, Devdutt Pattanaik, Chetan Bhagat, Amish Tripathi, Vālmīki, Vatsyāyana, and others
- Balance classic Indian literature (Ramayana, Vedas, Tagore) with contemporary voices (Ghosh, Roy, Adiga)
- The remaining ~10 books should be diverse international authors
- Acceptable range: 8-12 Indian authors (40-60%)

IMPORTANT - Context-Driven Curation:
Based on the current month, season, weather, and location above, you must:
1. Choose GENRES that naturally fit this moment in time
   - Winter/Cold: contemplative, philosophical, intimate literary works
   - Spring: renewal-themed, nature writing, hopeful narratives
   - Summer: lighter literary fiction, travel narratives, adventure
   - Fall: reflective memoirs, cozy mysteries, atmospheric fiction
   - Rainy/Cloudy: introspective, cozy reads
   - Clear/Sunny: uplifting, energizing books

2. Consider the READING MOOD from the context - this tells you what readers need right now

Your task:
1. Create a cohesive THEME that directly responds to the current season, weather, and time of year
2. Write a brief (2-3 sentence) DESCRIPTION explaining how this edition fits the moment
3. Select EXACTLY 20 books that match BOTH the theme AND the seasonal context
4. For each book, write:
   - why_this_book: Explain specifically WHY this book fits THIS moment in time (mention the season, weather, or time of year if relevant). Be literary and specific about how the book's content or mood matches the current context.
   - best_context: When/where to read it (e.g., "rainy afternoons", "before sunrise", "by a window", "during winter evenings")
   - estimated_sessions: Number between 3-8

Guidelines:
- CRITICAL: Your genre choices must feel natural for the current season and weather
- Each book's "why_this_book" must explain the connection to the current moment
- Mix genres but keep them seasonally appropriate
- Be specific and evocative - explain the "why" not just "what"
- Think about how the reading experience changes with the season

Example "why_this_book" explanations:
GOOD: "Its meditation on solitude and winter landscapes perfectly mirrors February's introspective mood"
BAD: "A contemplative book about nature"

GOOD: "The protagonist's journey of renewal aligns with spring's energy and the promise of warmer days ahead"
BAD: "An uplifting story about change"

GOOD: "Rainy weather invites the slow unfolding of this intimate character study"
BAD: "A good book for quiet days"

Available books:
${catalogSample.map(b => `- ${b.id} | ${b.title} by ${b.author} | ${b.genres.join(', ')} | ${b.moods.join(', ')}`).join('\n')}

Respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "theme": "Theme title (3-6 words)",
  "description": "Brief description of the edition (2-3 sentences)",
  "books": [
    {
      "id": "book_id_from_catalog",
      "title": "book title",
      "author": "author name",
      "why_this_book": "Literary, specific reason this book fits the theme",
      "best_context": "when/where to read it",
      "estimated_sessions": 5,
      "genres": ["genre1", "genre2"]
    }
  ]
}`;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        temperature: 0.8,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!apiResponse.ok) {
      console.error('Anthropic API error:', await apiResponse.text());
      throw new Error('AI API request failed');
    }

    const data = await apiResponse.json();
    const responseText = data?.content?.[0]?.text ?? '';

    // Parse AI response
    let aiResponse: { theme: string; description: string; books: EditionBook[] };
    try {
      aiResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Response text:', responseText);
      throw new Error('Invalid AI response format');
    }

    // Enforce Indian author requirement (40% minimum for balance)
    const selectedBooks = aiResponse.books;
    const indianBookCount = selectedBooks.filter(book =>
      isIndianAuthor(book.author)
    ).length;
    const indianPercentage = (indianBookCount / selectedBooks.length) * 100;

    console.log(`📊 Indian author representation: ${indianBookCount}/${selectedBooks.length} (${indianPercentage.toFixed(1)}%)`);

    // If below 40%, log warning and enforce
    if (indianPercentage < 40) {
      console.warn(`⚠️ WARNING: AI only selected ${indianPercentage.toFixed(1)}% Indian authors. Enforcing 40% minimum...`);

      // Separate current selections
      const selectedIndian = selectedBooks.filter(book => isIndianAuthor(book.author));
      const selectedInternational = selectedBooks.filter(book => !isIndianAuthor(book.author));

      // Calculate how many more Indian books we need
      const targetIndian = Math.ceil(selectedBooks.length * 0.4); // 40% minimum
      const neededIndian = targetIndian - selectedIndian.length;

      if (neededIndian > 0 && indianBooks.length > selectedIndian.length) {
        // Get additional Indian books that weren't selected
        const selectedIds = new Set(selectedBooks.map(b => b.id));
        const availableIndian = indianBooks
          .filter(book => !selectedIds.has(book.id))
          .slice(0, neededIndian)
          .map(book => ({
            id: book.id,
            title: book.title,
            author: book.author,
            why_this_book: `A thoughtful ${book.genres[0] || 'literary'} work that fits the contemplative mood of the season.`,
            best_context: 'quiet reading moments',
            estimated_sessions: 5,
            genres: book.genres.slice(0, 2)
          } as EditionBook));

        // Replace international books with Indian ones
        const finalBooks = [
          ...selectedIndian,
          ...availableIndian,
          ...selectedInternational.slice(0, selectedBooks.length - targetIndian)
        ];

        aiResponse.books = finalBooks;
        console.log(`✅ Adjusted to ${targetIndian}/${finalBooks.length} Indian authors (${((targetIndian/finalBooks.length)*100).toFixed(1)}%)`);
      }
    } else {
      console.log(`✅ Indian author requirement met: ${indianPercentage.toFixed(1)}%`);
    }

    // Build response with current month
    const response: AIEditionResponse = {
      theme: aiResponse.theme,
      description: aiResponse.description,
      books: aiResponse.books,
      month: currentMonth
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI Edition error:', error);
    return NextResponse.json(
      { error: 'Failed to generate edition' },
      { status: 500 }
    );
  }
}
