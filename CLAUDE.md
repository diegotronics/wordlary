# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js 16 with Turbopack)
npm run build        # Production build (also runs TypeScript type checking)
npm run lint         # ESLint
npm run test         # Run tests once (Vitest)
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run db:push      # Push Supabase migrations
```

## Architecture

Wordlary is a vocabulary learning app for Spanish speakers learning English. Users register, pick interests during onboarding, receive daily AI-generated word sessions (via Google Gemini), and review words using spaced repetition (SM-2 algorithm).

### Data Flow

1. **Auth**: Supabase Auth (email/password + Google OAuth). Next.js 16 replaces `middleware.ts` with `src/proxy.ts` (exported function `proxy`). It protects all routes, redirecting unauthenticated users to `/login` and users who haven't completed onboarding to `/onboarding`. API routes (`/api/*`) are excluded from the onboarding redirect since they handle auth independently.

2. **Daily Session Lifecycle**: Dashboard loads → `GET /api/session` (creates today's session if none exists, timezone-aware) → if `needs_generation` is true, client calls `POST /api/generate` → tries word bank first, falls back to Gemini → words inserted in DB (dual-write to `word_bank`) → user flips through cards → `PATCH /api/words/[id]` marks each as learned (also creates `review_schedule` entry and updates streak).

3. **Spaced Repetition**: `GET /api/review` fetches words with `next_review_date <= today`. User rates recall quality (Again=0, Hard=1, Good=4, Easy=5). `POST /api/review/submit` applies SM-2 algorithm from `src/lib/spaced-repetition/sm2.ts` to compute next interval and ease factor. Failed words (quality < 4) are re-queued within the session.

### Supabase Client Pattern

Three client factories in `src/lib/supabase/`:
- **`server.ts`** — async `createClient()` using `cookies()` from `next/headers`. Used in all API route handlers and server components.
- **`client.ts`** — `createClient()` using `createBrowserClient`. Used in client components.
- **`middleware.ts`** — `updateSession()` for the Next.js proxy to refresh auth tokens.

All API routes authenticate via `supabase.auth.getUser()` and verify resource ownership with `.eq('user_id', user.id)`. Database has RLS policies as a second auth layer.

### State Management

Zustand stores in `src/stores/` manage client-side UI state:
- **`session-store.ts`** — session lifecycle, word navigation, mark-as-learned (auto-chains `fetchSession` → `generateWords` when needed)
- **`review-store.ts`** — review word list (Map + queue), card flip state, review submission, re-queuing failed words, session stats tracking

Hooks in `src/hooks/` wrap these stores and trigger initial data fetching on mount. SWR is used for polling/caching in `use-stats` and `use-session-status`.

### Gemini Integration (`src/lib/gemini/`)

- `client.ts` — configures `gemini-2.5-flash` with JSON response mode and temperature 0.8
- `prompts.ts` — `buildWordGenerationPrompt()` takes interests, existing words to exclude, count, and difficulty level
- `parse.ts` — `parseGeminiResponse()` validates Gemini output against Zod schema, returns discriminated union `{ success, words }` or `{ success: false, error }`

### Word Bank (`word_bank` table)

A shared platform vocabulary that grows via dual-write. When `POST /api/generate` is called, it first tries to fetch matching words from the word bank (by interest + difficulty). Any shortfall is generated via Gemini, and those new words are dual-written back to the word bank (fire-and-forget). This reduces Gemini API calls over time.

### Pronunciation

`src/hooks/use-pronunciation.ts` uses the browser's Web Speech API (`speechSynthesis`) for audio playback. Supports normal (1.0x) and slow (0.65x) playback speeds.

### Database

Schema is managed exclusively through incremental migrations in `supabase/migrations/`. There is no standalone schema file — migrations are the single source of truth. To see the full current schema, run `supabase db dump`. Key tables: `profiles`, `interests` (12 seeded categories), `user_interests`, `daily_sessions` (unique per user+date), `learned_words` (unique on user+LOWER(word)), `review_schedule` (SM-2 data), `word_bank` (shared vocabulary). Trigger `handle_new_user()` auto-creates a profile row on auth signup.

### Layout

Route groups: `(auth)` for login/register, `(dashboard)` for the main app, `(session)` for the learning session (separate layout). Dashboard layout renders a desktop sidebar (`md:` breakpoint) and mobile bottom tab bar. The `(dashboard)/page.tsx` is the home route (`/`).

### Testing

Vitest with jsdom environment. Setup in `src/__tests__/setup.ts` with mocks for next-intl and next/navigation. Tests cover:
- **Unit**: SM-2 algorithm, Gemini parsing, prompt builder, validators, date utilities
- **API routes**: session, words/[id], review/submit
- **Stores**: session-store, review-store

Helper mock for Supabase in `src/__tests__/helpers/supabase-mock.ts`.

## Key Conventions

- Next.js 16 dynamic route params are `Promise`-based: `{ params }: { params: Promise<{ id: string }> }` — must `await params`.
- Supabase joins (e.g., `interests(slug)`) return arrays, not single objects — handle with `Array.isArray()` check or index access.
- Zod 4 is installed but runs in v3-compat mode. Standard APIs like `.uuid()`, `.safeParse()` work normally.
- API routes return snake_case JSON; the `use-stats` hook maps to camelCase for components.
- The `perspective-1000` CSS utility for 3D card flips is defined in `globals.css`.
- Review quality values: Again=0, Hard=1, Good=4, Easy=5 (not 3).

### Internationalization (i18n)

- Uses `next-intl` in "without i18n routing" mode — no locale prefixes in URLs.
- Supported locales: `es` (default), `en`. Config in `src/i18n/config.ts`.
- Locale resolution order: `NEXT_LOCALE` cookie → `profiles.preferred_language` → default `es`.
- Translation files: `src/i18n/messages/{locale}.json`, organized by namespace.
- **All new UI strings must be added to both `es.json` and `en.json`** — never hardcode user-facing text.
- Server Components: `const t = await getTranslations('namespace')` from `next-intl/server`.
- Client Components: `const t = useTranslations('namespace')` from `next-intl`.
- Root layout wraps children in `NextIntlClientProvider`.
- Language switching: `POST /api/locale` updates profile + cookie, then `router.refresh()`.
- Interest names are translated client-side using the `interests` namespace, keyed by slug.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anonymous key
GOOGLE_GEMINI_API_KEY         # Server-only Gemini API key
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED # Optional: enable Google OAuth (default: false)
```
