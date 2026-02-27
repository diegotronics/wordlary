// ============================================================================
// VocabFlow - Application Constants
// ============================================================================

// ---------------------------------------------------------------------------
// Interest Categories
// ---------------------------------------------------------------------------
export const INTERESTS = [
  { name: "Technology", slug: "technology", emoji: "\u{1F4BB}" },
  { name: "Sports", slug: "sports", emoji: "\u26BD" },
  { name: "Cooking", slug: "cooking", emoji: "\u{1F373}" },
  { name: "Music", slug: "music", emoji: "\u{1F3B5}" },
  { name: "Travel", slug: "travel", emoji: "\u2708\uFE0F" },
  { name: "Science", slug: "science", emoji: "\u{1F52C}" },
  { name: "Business", slug: "business", emoji: "\u{1F4BC}" },
  { name: "Health", slug: "health", emoji: "\u{1F3E5}" },
  { name: "Entertainment", slug: "entertainment", emoji: "\u{1F3AC}" },
  { name: "Nature", slug: "nature", emoji: "\u{1F33F}" },
  { name: "Art", slug: "art", emoji: "\u{1F3A8}" },
  { name: "Literature", slug: "literature", emoji: "\u{1F4DA}" },
] as const;

// ---------------------------------------------------------------------------
// Interest Selection Limits
// ---------------------------------------------------------------------------
export const MIN_INTERESTS = 3;
export const MAX_INTERESTS = 6;

// ---------------------------------------------------------------------------
// Daily Learning Defaults
// ---------------------------------------------------------------------------
export const DEFAULT_DAILY_WORDS = 10;

// ---------------------------------------------------------------------------
// Spaced Repetition Parameters
// ---------------------------------------------------------------------------
export const MIN_EASE_FACTOR = 1.3;

export const REVIEW_QUALITIES = {
  Again: 0,
  Hard: 1,
  Good: 3,
  Easy: 5,
} as const;

// ---------------------------------------------------------------------------
// Route Constants
// ---------------------------------------------------------------------------
export const ROUTES = {
  AUTH: {
    LOGIN: "/login",
    SIGNUP: "/signup",
    CALLBACK: "/auth/callback",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
  },
} as const;
