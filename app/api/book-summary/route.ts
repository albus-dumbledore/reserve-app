import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = String(body?.title || '').trim();
    const author = String(body?.author || '').trim();

    if (!title) {
      return NextResponse.json({ error: 'Title required.' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        author: author || '',
        summary: 'A physical book in your reading room.'
      });
    }

    // Use Claude to find multiple book matches
    const bookQuery = author ? `"${title}" by ${author}` : `"${title}"`;
    const prompt = `You are a knowledgeable literary expert helping users find books.

Book search: ${bookQuery}

🇮🇳 INDIAN READER:
- When possible, prioritize Indian editions or Indian authors
- Include books available in India or relevant to Indian readers
- If the search clearly indicates a Western/international book, find that book but also suggest similar Indian alternatives

IMPORTANT - TITLE VARIATIONS PRIORITY:
- The user wants to see ALL books with the same or similar title
- FIRST: Find all books with EXACT title match "${title}" (different authors, editions, years)
- SECOND: Find books with SIMILAR titles (e.g., "The Alchemist's Daughter", "Alchemist of Souls")
- THIRD: Only then add thematically similar books
- The user may have wrong author info, so show ALL title matches regardless of author

Example: If searching "The Alchemist", return:
1. The Alchemist by Paulo Coelho (1988)
2. The Alchemist by Ben Jonson (1610 play)
3. The Alchemist's Daughter by Katharine McMahon
4. Other books with "Alchemist" in title
5. Similar themed books only if less than 5 title matches

Task: Find the top 5 books that match this search query, prioritizing title variations.

For each book:
1. Provide the exact title and author name (CORRECT author, even if user got it wrong)
2. Write a beautiful, evocative 1-2 sentence summary (under 50 words)

Guidelines for summaries:
- Use poetic, gentle language that invites the reader
- Focus on themes, mood, and emotional resonance
- Avoid spoilers
- Make it intimate and personal

CRITICAL - Return format:
- Return ONLY valid JSON, no explanatory text before or after
- No markdown code blocks, no "Here are the books", just pure JSON
- Start with [ and end with ]

Return JSON array with this exact format:
[
  {
    "title": "Exact Book Title",
    "author": "Actual Author Name",
    "summary": "Beautiful summary here",
    "year": 2020
  }
]

Important:
- Return 3-5 books maximum
- Prioritize books with MATCHING/SIMILAR TITLES over thematic similarity
- Order: Exact title matches → Similar titles → Themed books
- If multiple books have the same title (e.g., different authors/years), INCLUDE ALL OF THEM
- Include publication year if known (otherwise use null)
- Author is often wrong - don't filter by author, filter by TITLE
- RETURN ONLY THE JSON ARRAY, NOTHING ELSE

Example summaries:
- "A tender exploration of memory and loss, where quiet moments become profound revelations."
- "Through gentle prose, this story illuminates the hidden corners of the human heart."`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        temperature: 0.4,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      return NextResponse.json({
        books: [{
          title: title,
          author: author || '',
          summary: 'A physical book in your reading room.',
          year: null
        }]
      });
    }

    const data = await response.json();
    const content = data?.content?.[0]?.text ?? '';

    let parsed: Array<{ title: string; author: string; summary: string; year?: number | null }> | null = null;
    try {
      // Try direct JSON parse first
      parsed = JSON.parse(content);
    } catch (parseError) {
      // If that fails, try to extract JSON array from text
      try {
        const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          console.error('Failed to parse book search response:', content);
          parsed = null;
        }
      } catch {
        console.error('Failed to extract JSON from response:', content);
        parsed = null;
      }
    }

    if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
      return NextResponse.json({
        books: [{
          title: title,
          author: author || 'Unknown Author',
          summary: `A thoughtful read waiting to be discovered. Add it to your library and begin your journey with this book.`,
          year: null
        }]
      });
    }

    return NextResponse.json({
      books: parsed.slice(0, 5)
    });
  } catch (error) {
    console.error('Book summary error:', error);
    return NextResponse.json(
      { error: 'Summary service unavailable.' },
      { status: 500 }
    );
  }
}
