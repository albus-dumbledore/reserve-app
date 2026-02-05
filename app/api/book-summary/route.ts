import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = String(body?.title || '').trim();
    const author = String(body?.author || '').trim();

    if (!title) {
      return NextResponse.json({ error: 'Title required.' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Summary service unavailable.' },
        { status: 503 }
      );
    }

    const prompt = `Book: ${title}${author ? ` by ${author}` : ''}.\n\nProvide:\n1. Author name (if not provided or if you can identify it)\n2. A beautiful, evocative 2-3 sentence summary that captures the essence and atmosphere of this book. Use poetic, gentle language that invites the reader into the world of the story. Focus on themes, mood, and emotional resonance rather than plot details. Avoid spoilers. Keep it under 60 words.\n\nReturn JSON only: {"author": "Author Name", "summary": "..."}\n\nIf author is unknown, return empty string for author field.`;

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
      return NextResponse.json(
        { error: 'Summary service unavailable.' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data?.content?.[0]?.text ?? '';

    let parsed: { author?: string; summary?: string } | null = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = null;
    }

    const summary = parsed?.summary ?? content?.trim();
    const fetchedAuthor = parsed?.author?.trim() || author || '';

    if (!summary) {
      return NextResponse.json(
        { error: 'Summary service unavailable.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ author: fetchedAuthor, summary });
  } catch (error) {
    return NextResponse.json(
      { error: 'Summary service unavailable.' },
      { status: 500 }
    );
  }
}
