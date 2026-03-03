import { GET } from './route'
import { createMockSupabase, createQueryBuilder } from '@/__tests__/helpers/supabase-mock'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-03-15T14:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
})

describe('GET /api/session', () => {
  it('returns 401 when not authenticated', async () => {
    const { supabase } = createMockSupabase({ user: null })
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 403 when onboarding not completed', async () => {
    const { supabase, fromMocks } = createMockSupabase()

    const profilesBuilder = createQueryBuilder({ onboarding_completed: false, timezone: 'UTC' })
    fromMocks.set('profiles', profilesBuilder)

    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('returns existing session with words when session exists', async () => {
    const { supabase, fromMocks } = createMockSupabase()

    // profiles
    const profilesBuilder = createQueryBuilder({ onboarding_completed: true, timezone: 'UTC' })
    fromMocks.set('profiles', profilesBuilder)

    // daily_sessions → existing session
    const existingSession = { id: 'sess-1', session_date: '2026-03-15', word_count: 5, words_completed: 0 }
    const sessionsBuilder = createQueryBuilder()
    sessionsBuilder.maybeSingle = vi.fn().mockResolvedValue({ data: existingSession, error: null })
    fromMocks.set('daily_sessions', sessionsBuilder)

    // learned_words
    const wordsData = [{ id: 'w1', word: 'test' }]
    const wordsBuilder = createQueryBuilder()
    // Override the terminal behavior: when the chain ends, return wordsData
    wordsBuilder.order = vi.fn().mockResolvedValue({ data: wordsData, error: null })
    fromMocks.set('learned_words', wordsBuilder)

    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.session.id).toBe('sess-1')
    expect(body.words).toHaveLength(1)
  })

  it('returns needs_generation=true when session has no words', async () => {
    const { supabase, fromMocks } = createMockSupabase()

    const profilesBuilder = createQueryBuilder({ onboarding_completed: true, timezone: 'UTC' })
    fromMocks.set('profiles', profilesBuilder)

    const existingSession = { id: 'sess-1', session_date: '2026-03-15', word_count: 5, words_completed: 0 }
    const sessionsBuilder = createQueryBuilder()
    sessionsBuilder.maybeSingle = vi.fn().mockResolvedValue({ data: existingSession, error: null })
    fromMocks.set('daily_sessions', sessionsBuilder)

    const wordsBuilder = createQueryBuilder()
    wordsBuilder.order = vi.fn().mockResolvedValue({ data: [], error: null })
    fromMocks.set('learned_words', wordsBuilder)

    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.needs_generation).toBe(true)
  })

  it('creates new session when none exists for today', async () => {
    const { supabase, fromMocks } = createMockSupabase()

    // profiles — first call returns onboarding check, second returns daily_word_count
    const profilesBuilder = createQueryBuilder({ onboarding_completed: true, timezone: 'UTC', daily_word_count: 10 })
    fromMocks.set('profiles', profilesBuilder)

    // daily_sessions → no existing session
    const sessionsBuilder = createQueryBuilder()
    sessionsBuilder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    // insert chain for creating new session
    const newSession = { id: 'new-sess', session_date: '2026-03-15', word_count: 10 }
    sessionsBuilder.single = vi.fn().mockResolvedValue({ data: newSession, error: null })
    fromMocks.set('daily_sessions', sessionsBuilder)

    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.needs_generation).toBe(true)
    expect(body.words).toEqual([])
  })
})
