// ────────────────────────────────────────
//  LinguaBook Pro — OpenAI API Helpers (Server-side)
// ────────────────────────────────────────

import { AI_MODEL_TRANSLATE, AI_MODEL_CHAT, AI_MODEL_TTS, AI_TTS_VOICE } from './constants';

const OPENAI_BASE = 'https://api.openai.com/v1';

function getHeaders() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not set in .env.local');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
  };
}

// ── Translate text ─────────────────────
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  const prompt = `Translate the following book text into ${targetLanguage}.

Rules:
- natural, fluent translation
- preserve meaning and paragraph formatting
- no explanations, no extra text
- only the translated text

TEXT:
${text}`;

  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: AI_MODEL_TRANSLATE,
      messages: [
        { role: 'system', content: 'You are a professional literary translator.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices?.[0]?.message?.content ?? '';
}

// ── Detect language ────────────────────
export async function detectLanguage(text: string): Promise<string> {
  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: AI_MODEL_TRANSLATE,
      messages: [
        {
          role: 'user',
          content: `What language is this text written in? Reply with only the language name in English (e.g. "English", "Russian", "Uzbek").\n\nText: ${text.slice(0, 500)}`,
        },
      ],
      temperature: 0,
      max_tokens: 10,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices?.[0]?.message?.content?.trim() ?? 'Unknown';
}

// ── Chat / Book analysis ───────────────
export async function chatWithBook(question: string, bookContext: string): Promise<string> {
  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: AI_MODEL_CHAT,
      messages: [
        {
          role: 'system',
          content: `You are a literary analysis assistant. Here is the book content:\n\n${bookContext.slice(0, 8000)}\n\nAnswer questions based on this content. Be concise and helpful.`,
        },
        { role: 'user', content: question },
      ],
      temperature: 0.5,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices?.[0]?.message?.content ?? '';
}

// ── Generate audio (TTS) ───────────────
export async function generateAudio(text: string): Promise<ArrayBuffer> {
  const res = await fetch(`${OPENAI_BASE}/audio/speech`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: AI_MODEL_TTS,
      voice: AI_TTS_VOICE,
      input: text.slice(0, 4096), // OpenAI TTS max 4096 chars
      response_format: 'mp3',
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? 'Audio generation failed');
  }

  return res.arrayBuffer();
}
