# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js 16 with Turbopack)
npm run build        # Production build (also runs TypeScript type checking)
npm run lint         # ESLint
```

No test framework is configured.

## Architecture

VocabFlow is a vocabulary learning app for Spanish speakers learning English. Users register, pick interests during onboarding, receive daily AI-generated word sessions (via Google Gemini), and review words using spaced repetition (SM-2 algorithm).

### Data Flow

1. **Auth**: Supabase Auth (email/password + Google OAuth). Middleware at `src/middleware.ts` protects all routes, redirecting unauthenticated users to `/login` and users who haven't completed onboarding to `/onboarding`.

2. **Daily Session Lifecycle**: Dashboard loads → `GET /api/session` (creates today's session if none exists) → if `needs_generation` is true, client calls `POST /api/generate` → Gemini generates words → words inserted in DB → user flips through cards → `PATCH /api/words/[id]` marks each as learned (also creates `review_schedule` entry and updates streak).

3. **Spaced Repetition**: `GET /api/review` fetches words with `next_review_date <= today`. User rates recall quality (Again=0, Hard=1, Good=3, Easy=5). `POST /api/review/submit` applies SM-2 algorithm from `src/lib/spaced-repetition/sm2.ts` to compute next interval and ease factor.

### Supabase Client Pattern

Three client factories in `src/lib/supabase/`:
- **`server.ts`** — async `createClient()` using `cookies()` from `next/headers`. Used in all API route handlers and server components.
- **`client.ts`** — `createClient()` using `createBrowserClient`. Used in client components.
- **`middleware.ts`** — `updateSession()` for the Next.js middleware to refresh auth tokens.

All API routes authenticate via `supabase.auth.getUser()` and verify resource ownership with `.eq('user_id', user.id)`. Database has RLS policies as a second auth layer.

### State Management

Zustand stores in `src/stores/` manage client-side UI state:
- **`session-store.ts`** — session lifecycle, word navigation, mark-as-learned (auto-chains `fetchSession` → `generateWords` when needed)
- **`review-store.ts`** — review word list, card flip state, review submission

Hooks in `src/hooks/` wrap these stores and trigger initial data fetching on mount.

### Gemini Integration (`src/lib/gemini/`)

- `client.ts` — configures `gemini-2.0-flash` with JSON response mode and temperature 0.8
- `prompts.ts` — `buildWordGenerationPrompt()` takes interests, existing words to exclude, count, and difficulty level
- `parse.ts` — `parseGeminiResponse()` validates Gemini output against Zod schema, returns discriminated union `{ success, words }` or `{ success: false, error }`

### Database

Schema lives in `supabase/schema.sql`. Key tables: `profiles`, `interests` (12 seeded categories), `user_interests`, `daily_sessions` (unique per user+date), `learned_words` (unique on user+LOWER(word)), `review_schedule` (SM-2 data). Trigger `handle_new_user()` auto-creates a profile row on auth signup.

### Layout

Route groups: `(auth)` for login/register, `(dashboard)` for the main app. Dashboard layout renders a desktop sidebar (`md:` breakpoint) and mobile bottom tab bar. The `(dashboard)/page.tsx` is the home route (`/`).

## Key Conventions

- Next.js 16 dynamic route params are `Promise`-based: `{ params }: { params: Promise<{ id: string }> }` — must `await params`.
- Supabase joins (e.g., `interests(slug)`) return arrays, not single objects — handle with `Array.isArray()` check or index access.
- Zod 4 is installed but runs in v3-compat mode. Standard APIs like `.uuid()`, `.safeParse()` work normally.
- API routes return snake_case JSON; the `use-stats` hook maps to camelCase for components.
- The `perspective-1000` CSS utility for 3D card flips is defined in `globals.css`.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL     # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anonymous key
GOOGLE_GEMINI_API_KEY         # Server-only Gemini API key
```
