<div align="center">

# Wordlary

**AI-powered vocabulary learning for Spanish speakers mastering English.**

Daily personalized word sessions, interactive flashcards, and spaced repetition — all driven by Google Gemini.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?logo=supabase)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## Why Wordlary?

Most vocabulary apps give everyone the same word list. Wordlary generates **personalized words based on your interests** — if you love cooking, you'll learn kitchen vocabulary; if you're into tech, you'll get programming terms. Each day brings a fresh session of 10 words (configurable), and a built-in spaced repetition system makes sure you actually remember them.

### Key Features

- **AI-Generated Sessions** — Google Gemini creates daily word batches tailored to your chosen interests and difficulty level
- **3D Flashcards** — Interactive cards with smooth flip animations showing word, IPA pronunciation, example sentence, and Spanish translation
- **Spaced Repetition (SM-2)** — The same algorithm used by Anki. Rate your recall and the system schedules optimal review times
- **Streak Tracking** — Stay motivated with current and longest streak counters
- **Progress Dashboard** — See your stats: words learned, accuracy rate, words by topic
- **Dark Mode** — Full light/dark theme support
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
| Validation | [Zod 4](https://zod.dev/) |
| Animations | [Framer Motion](https://motion.dev/) |
| Icons | [Lucide React](https://lucide.dev/) |

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

Run the full schema against your Supabase project. You can do this from the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql):

```bash
# Or using the Supabase CLI
supabase db push
```

The schema (`supabase/schema.sql`) creates all tables, RLS policies, triggers, and seeds the 12 interest categories automatically.

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

1. User opens the dashboard → `GET /api/session` returns today's session (or creates one)
2. If the session needs words → client calls `POST /api/generate`
3. Gemini generates personalized words based on user interests and difficulty
4. User flips through flashcards → `PATCH /api/words/[id]` marks each word as learned
5. Each learned word gets a spaced repetition schedule entry

**Review Cycle:**

1. `GET /api/review` fetches words where `next_review_date <= today`
2. User flips the card and rates recall: Again (0), Hard (1), Good (3), Easy (5)
3. `POST /api/review/submit` applies the SM-2 algorithm to calculate the next review date

### SM-2 Algorithm

Wordlary uses the [SuperMemo SM-2](https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm) spaced repetition algorithm (the same one behind Anki). The implementation lives in [`src/lib/spaced-repetition/sm2.ts`](src/lib/spaced-repetition/sm2.ts).

## Project Structure

```
src/
├── app/
│   ├── (auth)/                 # Login & registration pages
│   ├── (dashboard)/            # Main app (home, review, progress, settings)
│   ├── onboarding/             # Interest picker (post-signup)
│   └── api/                    # REST API endpoints
│       ├── session/            #   Daily session management
│       ├── generate/           #   Gemini word generation
│       ├── words/[id]/         #   Mark words as learned
│       ├── review/             #   Get words due for review
│       ├── review/submit/      #   Submit review ratings
│       ├── stats/              #   User statistics
│       ├── interests/          #   Interest management
│       └── auth/callback/      #   OAuth callback
├── components/
│   ├── session/                # Word cards, session progress
│   ├── review/                 # Review cards, difficulty buttons
│   ├── dashboard/              # Streak display, stats overview
│   ├── layout/                 # Sidebar, header, mobile nav
│   ├── auth/                   # OAuth button
│   └── ui/                     # shadcn/ui primitives
├── hooks/                      # Data-fetching hooks
├── stores/                     # Zustand state (session, review)
└── lib/
    ├── supabase/               # Client factories (browser, server, middleware)
    ├── gemini/                 # AI client, prompts, response parser
    ├── spaced-repetition/      # SM-2 algorithm
    ├── types.ts                # TypeScript interfaces
    ├── constants.ts            # App-wide constants
    └── validators.ts           # Zod schemas
```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/session` | `GET` | Get or create today's daily session |
| `/api/generate` | `POST` | Generate words for the current session via Gemini |
| `/api/words/[id]` | `PATCH` | Mark a word as learned |
| `/api/review` | `GET` | Fetch words due for spaced repetition review |
| `/api/review/submit` | `POST` | Submit a review rating and update SM-2 schedule |
| `/api/stats` | `GET` | Get user learning statistics |
| `/api/interests` | `GET` | List all available interests |
| `/api/interests` | `PUT` | Update user's selected interests |
| `/api/auth/callback` | `GET` | Handle Supabase OAuth redirect |

All endpoints require authentication. API routes validate ownership via `supabase.auth.getUser()`, and all tables have Row Level Security policies as a second layer of protection.

## Database Schema

7 tables with full RLS — see [`supabase/schema.sql`](supabase/schema.sql) for the complete definition.

| Table | Purpose |
|-------|---------|
| `profiles` | User settings (streak, difficulty, daily word count) |
| `interests` | 12 seeded topic categories |
| `user_interests` | User ↔ Interest junction (3-6 per user) |
| `daily_sessions` | One session per user per day |
| `learned_words` | Words shown to users (unique per user + word) |
| `review_schedule` | SM-2 spaced repetition data per word |

## Available Scripts

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build (includes type checking)
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feat/your-feature
   ```
3. **Make your changes** and ensure the build passes:
   ```bash
   npm run build
   npm run lint
   ```
4. **Commit** with a clear message following [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add word pronunciation audio"
   ```
5. **Push** and open a **Pull Request**

### Ideas for Contributions

Here are some areas where help would be appreciated:

- **Testing** — Add a test framework (Vitest) and write unit/integration tests
- **i18n** — Expand the app to support other native languages beyond Spanish
- **Audio Pronunciation** — Integrate a text-to-speech API for word pronunciation
- **Word Categories** — Add more granular topic filtering within interests
- **Export/Import** — Let users export their word lists (CSV, Anki deck)
- **Offline Support** — Service worker for offline flashcard review
- **Accessibility** — Audit and improve keyboard navigation and screen reader support
- **Analytics Dashboard** — Charts for review accuracy over time, learning velocity

### Code Conventions

- TypeScript strict mode — no `any` unless absolutely necessary
- API routes return `snake_case` JSON; client hooks map to `camelCase`
- Supabase joins return arrays — always handle with index access or `Array.isArray()`
- Next.js 16 dynamic route params are `Promise`-based — always `await params`

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Built with learning in mind.

</div>
