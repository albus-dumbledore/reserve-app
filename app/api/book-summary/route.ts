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

    // Use Claude to identify the book and generate summary
    const bookQuery = author ? `"${title}" by ${author}` : `"${title}"`;
    const prompt = `You are a knowledgeable literary expert helping identify and summarize books.

Book search: ${bookQuery}

Task:
1. Identify the correct book (title and author)
2. If the author was provided, use that author; if not, determine the most well-known author for this title
3. Write a beautiful, evocative 2-3 sentence summary that captures the essence and atmosphere of the book

Guidelines for summary:
- Use poetic, gentle language that invites the reader into the world of the story
- Focus on themes, mood, and emotional resonance rather than plot details
- Avoid spoilers
- Keep it under 60 words
- Make it feel intimate and personal

Return JSON only with this exact format:
{
  "title": "Exact Book Title",
  "author": "Author Name",
  "summary": "Your beautiful summary here"
}

Examples of good summaries:
- "A tender exploration of memory and loss, where quiet moments become profound revelations about what it means to belong."
- "Through gentle prose and deep observation, this story illuminates the hidden corners of the human heart with warmth and wisdom."

IMPORTANT: If you cannot identify the book with confidence, return:
{
  "title": "${title}",
  "author": "${author || 'Unknown'}",
  "summary": "A physical book in your reading room."
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
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
        author: author || '',
        summary: 'A physical book in your reading room.'
      });
    }

    const data = await response.json();
    const content = data?.content?.[0]?.text ?? '';

    let parsed: { title?: string; author?: string; summary?: string } | null = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = null;
    }

    if (!parsed || !parsed.author || !parsed.summary) {
      return NextResponse.json({
        author: author || '',
        summary: 'A physical book in your reading room.'
      });
    }

    return NextResponse.json({
      author: parsed.author,
      summary: parsed.summary
    });
  } catch (error) {
    console.error('Book summary error:', error);
    return NextResponse.json(
      { error: 'Summary service unavailable.' },
      { status: 500 }
    );
  }
}
