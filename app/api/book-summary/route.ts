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

Task: Find the top 5 most likely books that match this search query.

For each book:
1. Provide the exact title and author name
2. Write a beautiful, evocative 1-2 sentence summary (under 50 words)

Guidelines for summaries:
- Use poetic, gentle language that invites the reader
- Focus on themes, mood, and emotional resonance
- Avoid spoilers
- Make it intimate and personal

Return JSON array with this exact format:
[
  {
    "title": "Exact Book Title",
    "author": "Author Name",
    "summary": "Beautiful summary here",
    "year": 2020
  }
]

Important:
- Return 3-5 books maximum
- If author was provided, prioritize books by that author
- Order by relevance (most likely match first)
- Include publication year if known (otherwise use null)
- If you can only find 1 book, return array with 1 item

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
      parsed = JSON.parse(content);
    } catch {
      parsed = null;
    }

    if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
      return NextResponse.json({
        books: [{
          title: title,
          author: author || '',
          summary: 'A physical book in your reading room.',
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
