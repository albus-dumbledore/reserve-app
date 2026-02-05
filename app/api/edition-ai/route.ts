import { NextResponse } from 'next/server';
import { bookCatalog } from '@/lib/books';
import type { EditionBook, ReadingContext } from '@/lib/types';

export const runtime = 'nodejs';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';

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

    // Prepare book catalog for AI (sample of diverse books to choose from)
    const catalogSample = bookCatalog
      .filter(book => book.title && book.author)
      .slice(0, 100) // Use 100 books to give AI more variety for 20 selections
      .map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        genres: book.genres.slice(0, 2), // Limit to 2 genres
        moods: book.moods.slice(0, 2) // Limit to 2 moods
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
