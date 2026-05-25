// ────────────────────────────────────────
//  LinguaBook Pro — TypeScript Types
// ────────────────────────────────────────

export type UserRole = 'freemium' | 'premium' | 'admin';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  wallet_balance: number;
  streak_days: number;
  created_at: string;
}

export type BookStatus = 'processing' | 'ready' | 'error' | 'removed';

export interface Book {
  id: string;
  uploader_id: string;
  title: string;
  original_language: string | null;
  translated_language: string | null;
  file_url: string | null;
  cover_url: string | null;
  page_count: number;
  is_public: boolean;
  is_paid: boolean;
  price: number;
  total_reads: number;
  avg_rating: number;
  status: BookStatus;
  created_at: string;
  // Joined
  uploader?: Profile;
  ratings?: Rating[];
  chapters?: Chapter[];
}

export interface Chapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string | null;
  content: string;
  audio_url: string | null;
  audio_generated: boolean;
  created_at: string;
}

export interface Rating {
  id: string;
  book_id: string;
  user_id: string;
  stars: number;
  comment: string | null;
  created_at: string;
  user?: Profile;
}

export type PurchaseStatus = 'pending' | 'completed' | 'refunded';

export interface Purchase {
  id: string;
  book_id: string;
  buyer_id: string;
  amount: number;
  seller_share: number;
  platform_share: number;
  payment_method: string;
  status: PurchaseStatus;
  created_at: string;
  book?: Book;
}

export type TransactionType = 'earning' | 'purchase' | 'withdrawal' | 'subscription';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  created_at: string;
}

// PDF processing
export interface PdfPage {
  page: number;
  text: string;
  canvas: HTMLCanvasElement | null;
}

export interface TranslatedPage {
  page: number;
  text: string;
  canvas: HTMLCanvasElement | null;
}

// Translation state
export interface TranslationState {
  selectedFile: File | null;
  selectedLanguage: string | null;
  pdfPages: PdfPage[];
  translatedPages: TranslatedPage[];
  isTranslating: boolean;
  progress: number;
  status: string;
  error: string | null;
  bookContext: string;
}

// Library filter
export interface BookFilter {
  search: string;
  originalLanguage: string | null;
  translatedLanguage: string | null;
  isPaid: boolean | null;
  sortBy: 'newest' | 'popular' | 'rating';
}

// Audio playback
export interface AudioState {
  currentChapter: number;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  isLoading: boolean;
}
