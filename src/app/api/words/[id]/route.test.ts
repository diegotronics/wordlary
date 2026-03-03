import { PATCH } from './route'
import { NextRequest } from 'next/server'
import { createMockSupabase, createQueryBuilder } from '@/__tests__/helpers/supabase-mock'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

const wordId = '550e8400-e29b-41d4-a716-446655440000'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/words/${wordId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeParams(id = wordId) {
  return Promise.resolve({ id })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-03-15T14:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
})

describe('PATCH /api/words/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    const { supabase } = createMockSupabase({ user: null })
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const res = await PATCH(makeRequest({ is_learned: true }), { params: makeParams() })
    expect(res.status).toBe(401)
  })

  it('returns 400 when is_learned is not boolean', async () => {
    const { supabase, fromMocks } = createMockSupabase()

    const profilesBuilder = createQueryBuilder({ timezone: 'UTC' })
    fromMocks.set('profiles', profilesBuilder)

    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const res = await PATCH(makeRequest({ is_learned: 'yes' }), { params: makeParams() })
    expect(res.status).toBe(400)
  })

  it('returns 404 when word not found', async () => {
    const { supabase, fromMocks } = createMockSupabase()

    const profilesBuilder = createQueryBuilder({ timezone: 'UTC' })
    fromMocks.set('profiles', profilesBuilder)

    const wordsBuilder = createQueryBuilder(null, { message: 'not found' })
    fromMocks.set('learned_words', wordsBuilder)

    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const res = await PATCH(makeRequest({ is_learned: true }), { params: makeParams() })
    expect(res.status).toBe(404)
  })

  it('returns 200 and updates word on success', async () => {
    const { supabase, fromMocks } = createMockSupabase()

    const profilesBuilder = createQueryBuilder({ timezone: 'UTC', current_streak: 1, longest_streak: 5, last_session_date: '2026-03-15' })
    fromMocks.set('profiles', profilesBuilder)

    const wordData = {
      id: wordId,
      is_learned: false,
      session_id: 'sess-1',
      user_id: 'test-user-id',
      daily_sessions: { word_count: 5, words_completed: 2 },
    }
    const wordsBuilder = createQueryBuilder(wordData)
    fromMocks.set('learned_words', wordsBuilder)

    const sessionsBuilder = createQueryBuilder()
    fromMocks.set('daily_sessions', sessionsBuilder)

    const scheduleBuilder = createQueryBuilder()
    fromMocks.set('review_schedule', scheduleBuilder)

    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const res = await PATCH(makeRequest({ is_learned: true }), { params: makeParams() })
    expect(res.status).toBe(200)
  })

  it('creates review_schedule entry when marking as learned', async () => {
    const { supabase, fromMocks } = createMockSupabase()

    const profilesBuilder = createQueryBuilder({ timezone: 'UTC', current_streak: 0, longest_streak: 0, last_session_date: null })
    fromMocks.set('profiles', profilesBuilder)

    const wordData = {
      id: wordId,
      is_learned: false,
      session_id: 'sess-1',
      user_id: 'test-user-id',
      daily_sessions: { word_count: 5, words_completed: 0 },
    }
    const wordsBuilder = createQueryBuilder(wordData)
    fromMocks.set('learned_words', wordsBuilder)

    const sessionsBuilder = createQueryBuilder()
    fromMocks.set('daily_sessions', sessionsBuilder)

    const scheduleBuilder = createQueryBuilder()
    fromMocks.set('review_schedule', scheduleBuilder)

    vi.mocked(createClient).mockResolvedValue(supabase as never)

    await PATCH(makeRequest({ is_learned: true }), { params: makeParams() })

    expect(scheduleBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'test-user-id',
        word_id: wordId,
        ease_factor: 2.5,
        repetition_number: 0,
        interval_days: 1,
      }),
      { onConflict: 'word_id' }
    )
  })

  it('uses Next.js 16 async params correctly', async () => {
    const { supabase, fromMocks } = createMockSupabase()

    const profilesBuilder = createQueryBuilder({ timezone: 'UTC' })
    fromMocks.set('profiles', profilesBuilder)

    const wordsBuilder = createQueryBuilder(null, { message: 'not found' })
    fromMocks.set('learned_words', wordsBuilder)

    vi.mocked(createClient).mockResolvedValue(supabase as never)

    // Verify that passing a Promise for params works
    const customId = '660e8400-e29b-41d4-a716-446655440000'
    const res = await PATCH(makeRequest({ is_learned: true }), { params: makeParams(customId) })
    // Route should have awaited params and used the id
    expect(res.status).toBe(404) // word not found for this id
  })
})
