import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';

async function searchOpenLibrary(title: string, author?: string) {
  try {
    // Build search query
    const searchQuery = author ? `${title} ${author}` : title;
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=5`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.docs || data.docs.length === 0) return null;

    // Find the best match - prefer exact title matches
    const titleLower = title.toLowerCase().trim();
    let bestMatch = data.docs[0];

    for (const doc of data.docs) {
      const docTitle = (doc.title || '').toLowerCase().trim();
      if (docTitle === titleLower || docTitle.includes(titleLower)) {
        bestMatch = doc;
        break;
      }
    }

    return {
      title: bestMatch.title || title,
      author: bestMatch.author_name?.[0] || author || '',
      publishYear: bestMatch.first_publish_year,
      isbn: bestMatch.isbn?.[0],
      subjects: bestMatch.subject?.slice(0, 3) || []
    };
  } catch (error) {
    console.error('Open Library search error:', error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = String(body?.title || '').trim();
    const author = String(body?.author || '').trim();

    if (!title) {
      return NextResponse.json({ error: 'Title required.' }, { status: 400 });
    }

    // First, search Open Library for accurate book info
    const bookInfo = await searchOpenLibrary(title, author);

    if (!bookInfo) {
      return NextResponse.json(
        {
          author: author || '',
          summary: 'A physical book in your reading room.'
        }
      );
    }

    // Use the verified book information from Open Library
    const verifiedTitle = bookInfo.title;
    const verifiedAuthor = bookInfo.author;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        author: verifiedAuthor,
        summary: `${verifiedTitle} by ${verifiedAuthor}.`
      });
    }

    // Now generate a summary using verified information
    const prompt = `Book: "${verifiedTitle}" by ${verifiedAuthor}${bookInfo.publishYear ? ` (${bookInfo.publishYear})` : ''}${bookInfo.subjects.length > 0 ? `\nSubjects: ${bookInfo.subjects.join(', ')}` : ''}\n\nProvide a beautiful, evocative 2-3 sentence summary that captures the essence and atmosphere of this specific book. Use poetic, gentle language that invites the reader into the world of the story. Focus on themes, mood, and emotional resonance rather than plot details. Avoid spoilers. Keep it under 60 words.\n\nReturn JSON only: {"summary": "..."}\n\nIMPORTANT: Make sure you're describing "${verifiedTitle}" by ${verifiedAuthor}, not a different book with a similar title.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        temperature: 0.4,
        messages: [
          {
            role: 'user',
            content: `You are a literary curator who writes beautiful, evocative book summaries that capture the soul of a story. Your writing is poetic yet concise, inviting yet precise.\n\n${prompt}`
          }
        ]
      })
    });

    if (!response.ok) {
      return NextResponse.json({
        author: verifiedAuthor,
        summary: `${verifiedTitle} by ${verifiedAuthor}.`
      });
    }

    const data = await response.json();
    const content = data?.content?.[0]?.text ?? '';

    let parsed: { summary?: string } | null = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = null;
    }

    const summary = parsed?.summary || `${verifiedTitle} by ${verifiedAuthor}.`;

    return NextResponse.json({
      author: verifiedAuthor,
      summary
    });
  } catch (error) {
    console.error('Book summary error:', error);
    return NextResponse.json(
      { error: 'Summary service unavailable.' },
      { status: 500 }
    );
  }
}
