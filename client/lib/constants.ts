// ────────────────────────────────────────
//  LinguaBook Pro — Constants
// ────────────────────────────────────────

export const LANGUAGES = [
  'Uzbek',
  'English',
  'Russian',
  'Turkish',
  'Arabic',
  'German',
  'French',
  'Spanish',
  'Japanese',
  'Korean',
  'Chinese',
] as const;

export type Language = (typeof LANGUAGES)[number];

export const LANG_EMOJI: Record<string, string> = {
  Uzbek: '🇺🇿',
  English: '🇬🇧',
  Russian: '🇷🇺',
  Turkish: '🇹🇷',
  Arabic: '🇸🇦',
  German: '🇩🇪',
  French: '🇫🇷',
  Spanish: '🇪🇸',
  Japanese: '🇯🇵',
  Korean: '🇰🇷',
  Chinese: '🇨🇳',
};

export const PLATFORM_COMMISSION = 0.3; // 30% platform, 70% seller
export const PREMIUM_PRICE_UZS = 99_000; // 99,000 UZS/oy
export const PREMIUM_PRICE_USD = 10;     // $10/oy

export const MAX_FREE_AUDIO_SECONDS = 0; // Freemium audio yo'q
export const MAX_CHUNK_SIZE = 2500;       // Tarjima chunk hajmi (belgi)

export const SUPABASE_STORAGE_BUCKET_BOOKS = 'books';
export const SUPABASE_STORAGE_BUCKET_AUDIO = 'audio';
export const SUPABASE_STORAGE_BUCKET_COVERS = 'covers';

export const AI_MODEL_TRANSLATE = 'gpt-4o-mini';
export const AI_MODEL_CHAT = 'gpt-4o-mini';
export const AI_MODEL_TTS = 'tts-1';
export const AI_TTS_VOICE = 'alloy'; // nova, shimmer, echo, onyx, fable, alloy
