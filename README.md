<div align="center">

# Wordlary

**AI-powered vocabulary learning for Spanish speakers mastering English.**

Daily personalized word sessions, interactive flashcards, and spaced repetition — all driven by Google Gemini.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?logo=supabase)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![License](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

</div>

---

## Why Wordlary?

Most vocabulary apps give everyone the same word list. Wordlary generates **personalized words based on your interests** — if you love cooking, you'll learn kitchen vocabulary; if you're into tech, you'll get programming terms. Each day brings a fresh session of 10 words (configurable), and a built-in spaced repetition system makes sure you actually remember them.

### Key Features

- **AI-Generated Sessions** — Google Gemini creates daily word batches tailored to your chosen interests and difficulty level
- **Smart Word Bank** — Platform-wide vocabulary grows over time, reducing AI calls while keeping words fresh and relevant
- **3D Flashcards** — Interactive cards with smooth flip animations showing word, IPA pronunciation, example sentence, and Spanish translation
- **Pronunciation** — Audio playback via the browser's Web Speech API, supporting normal and slow speeds
- **Spaced Repetition (SM-2)** — The same algorithm used by Anki. Rate your recall and the system schedules optimal review times
- **Word Library** — Browse, search, and filter all your learned words with pagination and sorting
- **Streak Tracking** — Stay motivated with current and longest streak counters
- **Progress Dashboard** — See your stats: words learned, accuracy rate, words by topic
- **Bilingual UI** — Full Spanish and English interface via next-intl
- **Dark Mode** — Full light/dark theme support
- **PWA Ready** — Installable as a Progressive Web App with service worker for offline access
- **Responsive Design** — Desktop sidebar + mobile bottom tab navigation
- **Secure by Default** — Row Level Security on every table, server-side auth validation on every endpoint

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Language | [TypeScript 5](https://typescriptlang.org/) |
| Auth & Database | [Supabase](https://supabase.com/) (Auth, PostgreSQL, RLS) |
| AI | [Google Gemini 2.5 Flash](https://ai.google.dev/) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://radix-ui.com/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| State Management | [Zustand 5](https://zustand.docs.pmnd.rs/) |
| Data Fetching | [SWR 2](https://swr.vercel.app/) |
| Validation | [Zod 4](https://zod.dev/) |
| Animations | [Framer Motion](https://motion.dev/) |
| i18n | [next-intl 4](https://next-intl.dev/) |
| Testing | [Vitest 4](https://vitest.dev/) + Testing Library |
| Icons | [Lucide React](https://lucide.dev/) |
| Analytics | [Vercel Analytics](https://vercel.com/analytics) + [Speed Insights](https://vercel.com/docs/speed-insights) |

## Getting Started

### Prerequisites

- **Node.js** 20+
- **npm** (or your preferred package manager)
- A [Supabase](https://supabase.com/) project (free tier works)
- A [Google Gemini API key](https://aistudio.google.com/apikey) (free tier works)

### 1. Clone and Install

```bash
git clone https://github.com/your-username/wordlary.git
cd wordlary
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Fill in your credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Optional: enable Google OAuth login
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false
```

### 3. Set Up the Database

Run the migrations against your Supabase project:

```bash
# Using the Supabase CLI
supabase db push
```

The migrations in `supabase/migrations/` create all tables, RLS policies, triggers, and seed the interest categories automatically.

### 4. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create your account.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Browser    │────▶│  Next.js 16  │────▶│    Supabase      │
│  (React 19)  │◀────│  API Routes  │◀────│  (Auth + PgSQL)  │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Google Gemini │
                    │  2.5 Flash   │
                    └──────────────┘
```

### Data Flow

**Daily Session Lifecycle:**

1. User opens the dashboard → `GET /api/session` returns today's session (or creates one, timezone-aware)
2. If the session needs words → client calls `POST /api/generate`
3. Word bank is queried first (by interest + difficulty); Gemini generates any remaining words
4. New Gemini words are dual-written to the shared word bank for future sessions
5. User flips through flashcards → `PATCH /api/words/[id]` marks each word as learned
6. Each learned word gets a spaced repetition schedule entry

**Review Cycle:**

1. `GET /api/review` fetches words where `next_review_date <= today`
2. User flips the card and rates recall: Again (0), Hard (1), Good (4), Easy (5)
3. `POST /api/review/submit` applies the SM-2 algorithm to calculate the next review date
4. Failed words (quality < 4) are re-queued within the same session

### SM-2 Algorithm

Wordlary uses the [SuperMemo SM-2](https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm) spaced repetition algorithm (the same one behind Anki). The implementation lives in [`src/lib/spaced-repetition/sm2.ts`](src/lib/spaced-repetition/sm2.ts).

## Project Structure

```
src/
├── app/
│   ├── (auth)/                 # Login & registration pages
│   ├── (dashboard)/            # Main app (home, review, progress, settings, words)
│   ├── (session)/              # Learning session (separate layout)
│   ├── onboarding/             # Interest picker (post-signup)
│   └── api/                    # REST API endpoints
│       ├── session/            #   Daily session management
│       ├── generate/           #   Word generation (word bank + Gemini)
│       ├── words/[id]/         #   Mark words as learned
│       ├── words/              #   Get session words
│       ├── words/all/          #   Paginated word list with filters
│       ├── review/             #   Get words due for review
│       ├── review/submit/      #   Submit review ratings
│       ├── stats/              #   User statistics
│       ├── interests/          #   Interest management
│       ├── locale/             #   Language preference
│       ├── health/             #   Health check
│       └── auth/callback/      #   OAuth callback
├── components/
│   ├── session/                # Word cards, session progress
│   ├── review/                 # Review cards, difficulty buttons
│   ├── dashboard/              # Streak display, stats overview
│   ├── layout/                 # Sidebar, header, mobile nav
│   ├── words/                  # Word list table, toolbar, pagination
│   ├── settings/               # Language picker
│   ├── shared/                 # Pronunciation buttons
│   ├── auth/                   # OAuth button
│   ├── pwa/                    # Service worker registration
│   └── ui/                     # shadcn/ui primitives
├── hooks/                      # Data-fetching hooks (SWR + Zustand wrappers)
├── stores/                     # Zustand state (session, review)
├── i18n/                       # next-intl config + message files (es, en)
├── __tests__/                  # Test setup + helpers
└── lib/
    ├── supabase/               # Client factories (browser, server, middleware)
    ├── gemini/                 # AI client, prompts, response parser
    ├── spaced-repetition/      # SM-2 algorithm
    ├── date.ts                 # Timezone-aware date utilities
    ├── types.ts                # TypeScript interfaces
    ├── constants.ts            # App-wide constants
    ├── utils.ts                # General utilities
    └── validators.ts           # Zod schemas
```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/session` | `GET` | Get or create today's daily session |
| `/api/generate` | `POST` | Generate words via word bank + Gemini fallback |
| `/api/words` | `GET` | Get words for a session |
| `/api/words/all` | `GET` | Paginated word list with search, filters, and sorting |
| `/api/words/[id]` | `PATCH` | Mark a word as learned |
| `/api/review` | `GET` | Fetch words due for spaced repetition review |
| `/api/review/submit` | `POST` | Submit a review rating and update SM-2 schedule |
| `/api/stats` | `GET` | Get user learning statistics |
| `/api/interests` | `GET` | List all available interests |
| `/api/interests` | `PUT` | Update user's selected interests |
| `/api/locale` | `POST` | Change language preference |
| `/api/health` | `GET` | Health check (DB connectivity) |
| `/api/auth/callback` | `GET` | Handle Supabase OAuth redirect |

All endpoints require authentication. API routes validate ownership via `supabase.auth.getUser()`, and all tables have Row Level Security policies as a second layer of protection.

## Database Schema

7 tables with full RLS — managed through incremental migrations in `supabase/migrations/`.

| Table | Purpose |
|-------|---------|
| `profiles` | User settings (streak, difficulty, daily word count, language, timezone) |
| `interests` | 12 seeded topic categories |
| `user_interests` | User ↔ Interest junction (3-6 per user) |
| `daily_sessions` | One session per user per day |
| `learned_words` | Words shown to users (unique per user + word) |
| `review_schedule` | SM-2 spaced repetition data per word |
| `word_bank` | Shared platform vocabulary (grows via dual-write from Gemini) |

## Available Scripts

```bash
npm run dev            # Start dev server with Turbopack
npm run build          # Production build (includes type checking)
npm run start          # Start production server
npm run lint           # Run ESLint
npm run test           # Run tests once (Vitest)
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run db:push        # Push Supabase migrations
```

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feat/your-feature
   ```
3. **Make your changes** and ensure the build and tests pass:
   ```bash
   npm run build
   npm run lint
   npm run test
   ```
4. **Commit** with a clear message following [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add word pronunciation audio"
   ```
5. **Push** and open a **Pull Request**

### Ideas for Contributions

Here are some areas where help would be appreciated:

- **More Languages** — Expand the app to support other native languages beyond Spanish
- **Word Categories** — Add more granular topic filtering within interests
- **Export/Import** — Let users export their word lists (CSV, Anki deck)
- **Accessibility** — Audit and improve keyboard navigation and screen reader support
- **Analytics Dashboard** — Charts for review accuracy over time, learning velocity
- **More Tests** — Expand test coverage for API routes and components

### Code Conventions

- TypeScript strict mode — no `any` unless absolutely necessary
- API routes return `snake_case` JSON; client hooks map to `camelCase`
- Supabase joins return arrays — always handle with index access or `Array.isArray()`
- Next.js 16 dynamic route params are `Promise`-based — always `await params`
- All UI strings go in both `src/i18n/messages/es.json` and `en.json` — never hardcode text

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).

---

<div align="center">

Built with learning in mind.

</div>
