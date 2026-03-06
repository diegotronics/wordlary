import { useReviewStore } from './review-store'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  vi.useFakeTimers()
  useReviewStore.getState().reset()
  mockFetch.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

function makeReviewFromApi(id: string, overrides = {}) {
  return {
    id: `schedule-${id}`,
    repetition_number: 1,
    ease_factor: 2.5,
    interval_days: 6,
    learned_words: {
      id,
      word: `word-${id}`,
      ipa: '/test/',
      example_sentence: 'Test.',
      word_es: 'prueba',
      sentence_es: 'Prueba.',
    },
    ...overrides,
  }
}

function seedStore(wordIds: string[]) {
  const wordsMap = new Map()
  const queue: string[] = []
  for (const id of wordIds) {
    wordsMap.set(id, {
      id,
      word: `word-${id}`,
      ipa: '/test/',
      example_sentence: 'Test.',
      word_es: 'prueba',
      sentence_es: 'Prueba.',
      review_schedule: { id: `s-${id}`, repetition_number: 1, ease_factor: 2.5, interval_days: 6 },
    })
    queue.push(id)
  }
  useReviewStore.setState({
    wordsMap,
    queue,
    totalUniqueWords: wordIds.length,
    completedCount: 0,
    isLoading: false,
    sessionStats: { totalReviews: 0, againCount: 0, hardCount: 0, goodCount: 0, easyCount: 0 },
    seenIds: new Set(),
  })
}

describe('useReviewStore', () => {
  // -------------------------------------------------------------------
  // fetchReviewWords
  // -------------------------------------------------------------------
  describe('fetchReviewWords', () => {
    it('populates wordsMap and queue from API response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ reviews: [makeReviewFromApi('w1'), makeReviewFromApi('w2')] }),
      })

      await useReviewStore.getState().fetchReviewWords()
      expect(useReviewStore.getState().wordsMap.size).toBe(2)
      expect(useReviewStore.getState().queue).toEqual(['w1', 'w2'])
    })

    it('sets totalUniqueWords correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ reviews: [makeReviewFromApi('w1')] }),
      })

      await useReviewStore.getState().fetchReviewWords()
      expect(useReviewStore.getState().totalUniqueWords).toBe(1)
    })

    it('skips entries without learned_words', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          reviews: [
            makeReviewFromApi('w1'),
            { id: 'orphan', learned_words: null },
          ],
        }),
      })

      await useReviewStore.getState().fetchReviewWords()
      expect(useReviewStore.getState().wordsMap.size).toBe(1)
    })

    it('resets session stats on fetch', async () => {
      useReviewStore.setState({
        sessionStats: { totalReviews: 10, againCount: 3, hardCount: 2, goodCount: 3, easyCount: 2 },
      })
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ reviews: [] }),
      })

      await useReviewStore.getState().fetchReviewWords()
      expect(useReviewStore.getState().sessionStats.totalReviews).toBe(0)
    })

    it('sets error on network failure', async () => {
      mockFetch.mockResolvedValue({ ok: false })

      await useReviewStore.getState().fetchReviewWords()
      expect(useReviewStore.getState().error).toBe('Failed to fetch review words')
    })
  })

  // -------------------------------------------------------------------
  // submitReview
  // -------------------------------------------------------------------
  describe('submitReview', () => {
    beforeEach(() => {
      seedStore(['w1', 'w2', 'w3'])
    })

    it('prevents double submission (isSubmitting guard)', async () => {
      useReviewStore.setState({ isSubmitting: true })
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ schedule: {} }) })

      await useReviewStore.getState().submitReview('w1', 4)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('on quality >= 4: increments completedCount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schedule: { interval_days: 6 } }),
      })

      const promise = useReviewStore.getState().submitReview('w1', 4)
      await vi.advanceTimersByTimeAsync(600)
      await promise

      expect(useReviewStore.getState().completedCount).toBe(1)
    })

    it('on quality < 4: re-queues word at end of queue', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schedule: { interval_days: 1 } }),
      })

      const promise = useReviewStore.getState().submitReview('w1', 1)
      await vi.advanceTimersByTimeAsync(600)
      await promise

      const { queue } = useReviewStore.getState()
      expect(queue[queue.length - 1]).toBe('w1')
    })

    it('on quality < 4: does not increment completedCount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schedule: { interval_days: 1 } }),
      })

      const promise = useReviewStore.getState().submitReview('w1', 0)
      await vi.advanceTimersByTimeAsync(600)
      await promise

      expect(useReviewStore.getState().completedCount).toBe(0)
    })

    it('removes first item from queue', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schedule: { interval_days: 6 } }),
      })

      const promise = useReviewStore.getState().submitReview('w1', 5)
      await vi.advanceTimersByTimeAsync(600)
      await promise

      expect(useReviewStore.getState().queue[0]).toBe('w2')
    })

    it('tracks quality in sessionStats', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schedule: { interval_days: 1 } }),
      })

      const promise = useReviewStore.getState().submitReview('w1', 0)
      await vi.advanceTimersByTimeAsync(600)
      await promise

      expect(useReviewStore.getState().sessionStats.againCount).toBe(1)
      expect(useReviewStore.getState().sessionStats.totalReviews).toBe(1)
    })

    it('adds wordId to seenIds', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schedule: { interval_days: 6 } }),
      })

      const promise = useReviewStore.getState().submitReview('w1', 4)
      await vi.advanceTimersByTimeAsync(600)
      await promise

      expect(useReviewStore.getState().seenIds.has('w1')).toBe(true)
    })

    it('resets isFlipped to false after submission', async () => {
      useReviewStore.setState({ isFlipped: true })
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schedule: { interval_days: 6 } }),
      })

      const promise = useReviewStore.getState().submitReview('w1', 5)
      await vi.advanceTimersByTimeAsync(600)
      await promise

      expect(useReviewStore.getState().isFlipped).toBe(false)
    })

    it('handles API error gracefully', async () => {
      mockFetch.mockResolvedValue({ ok: false })

      await useReviewStore.getState().submitReview('w1', 4)
      expect(useReviewStore.getState().error).toBe('Failed to submit review')
      expect(useReviewStore.getState().isSubmitting).toBe(false)
    })
  })

  // -------------------------------------------------------------------
  // flipCard
  // -------------------------------------------------------------------
  describe('flipCard', () => {
    it('toggles isFlipped true → false', () => {
      useReviewStore.setState({ isFlipped: true })
      useReviewStore.getState().flipCard()
      expect(useReviewStore.getState().isFlipped).toBe(false)
    })

    it('toggles isFlipped false → true', () => {
      useReviewStore.setState({ isFlipped: false })
      useReviewStore.getState().flipCard()
      expect(useReviewStore.getState().isFlipped).toBe(true)
    })
  })

  // -------------------------------------------------------------------
  // reset
  // -------------------------------------------------------------------
  describe('reset', () => {
    it('clears all state including Maps and Sets', () => {
      seedStore(['w1', 'w2'])
      useReviewStore.setState({ isFlipped: true, completedCount: 5 })

      useReviewStore.getState().reset()
      const state = useReviewStore.getState()
      expect(state.wordsMap.size).toBe(0)
      expect(state.queue).toHaveLength(0)
      expect(state.completedCount).toBe(0)
      expect(state.isFlipped).toBe(false)
      expect(state.seenIds.size).toBe(0)
    })
  })
})
