import { NextRequest, NextResponse } from 'next/server';
import { chatWithBook } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { question, bookContext } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const answer = await chatWithBook(question, bookContext ?? '');
    return NextResponse.json({ answer });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Chat failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
