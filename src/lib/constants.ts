// ============================================================================
// Wordlary - Application Constants
// ============================================================================

// ---------------------------------------------------------------------------
// Interest Categories
// Canonical slug→emoji map. The database `interests` table is the source of
// truth for the full list (id, name, slug, emoji). This map exists so
// client-side components can resolve an emoji from a slug without an extra
// fetch. Display names come from the `interests` i18n namespace.
// ---------------------------------------------------------------------------
export const INTEREST_EMOJI: Record<string, string> = {
  technology: '💻',
  sports: '⚽',
  cooking: '🍳',
  music: '🎵',
  travel: '✈️',
  science: '🔬',
  business: '💼',
  health: '🏥',
  entertainment: '🎬',
  nature: '🌿',
  art: '🎨',
  literature: '📚',
  fitness: '🏋️',
  finance: '💰',
  programming: '💻',
  history: '📜',
  geography: '🌍',
  movies: '🎥',
  tv: '📺',
  books: '📚',
}

// Ordered list of all interest slugs (used for filters / dropdowns)
export const INTEREST_SLUGS = Object.keys(INTEREST_EMOJI)

// ---------------------------------------------------------------------------
// Related Interests (for onboarding suggestions)
// ---------------------------------------------------------------------------
export const RELATED_INTERESTS: Record<string, string[]> = {
  technology: ['science', 'business', 'entertainment'],
  sports: ['health', 'nature'],
  cooking: ['health', 'nature', 'travel', 'science'],
  music: ['art', 'entertainment', 'literature'],
  travel: ['nature', 'art', 'cooking', 'literature'],
  science: ['technology', 'nature', 'health'],
  business: ['technology', 'literature'],
  health: ['sports', 'cooking', 'science', 'nature'],
  entertainment: ['music', 'art', 'literature', 'technology'],
  nature: ['science', 'travel', 'sports', 'health'],
  art: ['music', 'literature', 'entertainment'],
  literature: ['art', 'music', 'business', 'travel'],
  fitness: ['health', 'sports', 'nature'],
  finance: ['business', 'health', 'literature'],
  programming: ['technology', 'literature', 'business'],
  history: ['literature', 'business', 'science'],
  geography: ['literature', 'business', 'science'],
  movies: ['entertainment', 'literature', 'art'],
  tv: ['entertainment', 'literature', 'art'],
  books: ['literature', 'business', 'science'],
}

// ---------------------------------------------------------------------------
// Interest Selection Limits
// ---------------------------------------------------------------------------
export const MIN_INTERESTS = 3
export const MAX_INTERESTS = 6

// ---------------------------------------------------------------------------
// Daily Learning Defaults
// ---------------------------------------------------------------------------
export const DEFAULT_DAILY_WORDS = 10

// ---------------------------------------------------------------------------
// Spaced Repetition Parameters
// ---------------------------------------------------------------------------
export const MIN_EASE_FACTOR = 1.3

export const REVIEW_QUALITIES = {
  Again: 0,
  Hard: 1,
  Good: 4,
  Easy: 5,
} as const

// ---------------------------------------------------------------------------
// Route Constants
// ---------------------------------------------------------------------------
export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/signup',
    CALLBACK: '/auth/callback',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },
} as const
