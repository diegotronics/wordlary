import { POST } from './route'
import { NextRequest } from 'next/server'
import { createMockSupabase, createQueryBuilder } from '@/__tests__/helpers/supabase-mock'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/review/submit', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const validUUID = '550e8400-e29b-41d4-a716-446655440000'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-03-15T14:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
})

describe('POST /api/review/submit', () => {
  it('returns 401 when not authenticated', async () => {
    const { supabase } = createMockSupabase({ user: null })
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const res = await POST(makeRequest({ word_id: validUUID, quality: 4 }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when body fails validation (missing word_id)', async () => {
    const { supabase } = createMockSupabase()
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const res = await POST(makeRequest({ quality: 4 }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Invalid')
  })

  it('returns 400 when quality is invalid (e.g., 3)', async () => {
    const { supabase } = createMockSupabase()
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const res = await POST(makeRequest({ word_id: validUUID, quality: 3 }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when review_schedule not found', async () => {
    const { supabase, fromMocks } = createMockSupabase()

    // profiles.select → timezone
    const profilesBuilder = createQueryBuilder({ timezone: 'UTC' })
    fromMocks.set('profiles', profilesBuilder)

    // review_schedule → not found
    const scheduleBuilder = createQueryBuilder(null, { message: 'not found' })
    fromMocks.set('review_schedule', scheduleBuilder)

    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const res = await POST(makeRequest({ word_id: validUUID, quality: 4 }))
    expect(res.status).toBe(404)
  })

  it('returns 200 with updated schedule on success', async () => {
    const { supabase, fromMocks } = createMockSupabase()

    // profiles
    const profilesBuilder = createQueryBuilder({ timezone: 'UTC' })
    fromMocks.set('profiles', profilesBuilder)

    // review_schedule SELECT → existing schedule
    const existingSchedule = {
      id: 'schedule-1',
      repetition_number: 1,
      ease_factor: 2.5,
      interval_days: 6,
      total_reviews: 5,
      correct_reviews: 3,
    }
    const scheduleSelectBuilder = createQueryBuilder(existingSchedule)
    fromMocks.set('review_schedule', scheduleSelectBuilder)

    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const res = await POST(makeRequest({ word_id: validUUID, quality: 4 }))
    // The update chain returns via the same builder; the last .single() resolves
    // to our existingSchedule (which is the same mock). The route returns whatever
    // the update resolves to.
    expect(res.status).toBe(200)
  })

  it('increments correct_reviews when quality >= 4', async () => {
    const { supabase, fromMocks } = createMockSupabase()

    const profilesBuilder = createQueryBuilder({ timezone: 'UTC' })
    fromMocks.set('profiles', profilesBuilder)

    const existingSchedule = {
      id: 'schedule-1',
      repetition_number: 0,
      ease_factor: 2.5,
      interval_days: 1,
      total_reviews: 2,
      correct_reviews: 1,
    }
    const scheduleBuilder = createQueryBuilder(existingSchedule)
    fromMocks.set('review_schedule', scheduleBuilder)

    vi.mocked(createClient).mockResolvedValue(supabase as never)

    await POST(makeRequest({ word_id: validUUID, quality: 5 }))

    // Verify the update was called with incremented correct_reviews
    expect(scheduleBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        total_reviews: 3,
        correct_reviews: 2,
      })
    )
  })

  it('does not increment correct_reviews when quality < 4', async () => {
    const { supabase, fromMocks } = createMockSupabase()

    const profilesBuilder = createQueryBuilder({ timezone: 'UTC' })
    fromMocks.set('profiles', profilesBuilder)

    const existingSchedule = {
      id: 'schedule-1',
      repetition_number: 0,
      ease_factor: 2.5,
      interval_days: 1,
      total_reviews: 2,
      correct_reviews: 1,
    }
    const scheduleBuilder = createQueryBuilder(existingSchedule)
    fromMocks.set('review_schedule', scheduleBuilder)

    vi.mocked(createClient).mockResolvedValue(supabase as never)

    await POST(makeRequest({ word_id: validUUID, quality: 1 }))

    expect(scheduleBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        total_reviews: 3,
        correct_reviews: 1, // unchanged
      })
    )
  })
})
