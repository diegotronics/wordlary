// ============================================================================
// VocabFlow - TypeScript Type Definitions
// English vocabulary learning app for Spanish speakers
// ============================================================================

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------
export interface Profile {
  id: string;
  display_name: string | null;
  onboarding_completed: boolean;
  current_streak: number;
  longest_streak: number;
  last_session_date: string | null;
  daily_word_count: number;
  preferred_difficulty: "beginner" | "intermediate" | "advanced";
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Interest Categories
// ---------------------------------------------------------------------------
export interface Interest {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  created_at: string;
}

export interface UserInterest {
  id: string;
  user_id: string;
  interest_id: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Daily Learning Sessions
// ---------------------------------------------------------------------------
export interface DailySession {
  id: string;
  user_id: string;
  session_date: string;
  word_count: number;
  words_completed: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Learned Words
// ---------------------------------------------------------------------------
export interface LearnedWord {
  id: string;
  user_id: string;
  word: string;
  ipa: string;
  example_sentence: string;
  word_es: string;
  sentence_es: string;
  interest_slug: string;
  is_learned: boolean;
  session_id: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Spaced Repetition Review Schedule
// ---------------------------------------------------------------------------
export interface ReviewSchedule {
  id: string;
  user_id: string;
  word_id: string;
  repetition_number: number;
  ease_factor: number;
  interval_days: number;
  next_review_date: string;
  last_reviewed_at: string | null;
  total_reviews: number;
  correct_reviews: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Gemini AI Generated Word
// ---------------------------------------------------------------------------
export interface GeneratedWord {
  word: string;
  ipa: string;
  example_sentence: string;
  word_es: string;
  sentence_es: string;
  interest_slug: string;
}

// ---------------------------------------------------------------------------
// Spaced Repetition Review Quality Ratings
// ---------------------------------------------------------------------------
export type ReviewQuality = 0 | 1 | 3 | 5;
