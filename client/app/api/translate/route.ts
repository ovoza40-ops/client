import { NextRequest, NextResponse } from 'next/server';
import { translateText, detectLanguage } from '@/lib/openai';
import { MAX_CHUNK_SIZE } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const { text, targetLanguage, action } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (text.length > MAX_CHUNK_SIZE * 2) {
      return NextResponse.json({ error: 'Text too long' }, { status: 400 });
    }

    if (action === 'detect') {
      const language = await detectLanguage(text);
      return NextResponse.json({ language });
    }

    if (!targetLanguage) {
      return NextResponse.json({ error: 'Target language is required' }, { status: 400 });
    }

    const translated = await translateText(text, targetLanguage);
    return NextResponse.json({ translated });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Translation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
