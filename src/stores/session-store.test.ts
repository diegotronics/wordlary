import { useSessionStore } from './session-store'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function resetStore() {
  useSessionStore.getState().reset()
}

function makeSession(overrides = {}) {
  return {
    id: 'session-1',
    session_date: '2026-03-15',
    word_count: 3,
    words_completed: 0,
    is_completed: false,
    ...overrides,
  }
}

function makeWord(id: string, overrides = {}) {
  return {
    id,
    word: `word-${id}`,
    ipa: '/test/',
    example_sentence: 'Test sentence.',
    word_es: 'palabra',
    sentence_es: 'Frase de prueba.',
    interest_slug: 'technology',
    is_learned: false,
    ...overrides,
  }
}

beforeEach(() => {
  resetStore()
  mockFetch.mockReset()
})

describe('useSessionStore', () => {
  // -------------------------------------------------------------------
  // fetchSession
  // -------------------------------------------------------------------
  describe('fetchSession', () => {
    it('sets isLoading=true during fetch', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ session: makeSession(), words: [], needs_generation: false }),
      })

      const promise = useSessionStore.getState().fetchSession()
      expect(useSessionStore.getState().isLoading).toBe(true)
      await promise
      expect(useSessionStore.getState().isLoading).toBe(false)
    })

    it('sets session and words on success', async () => {
      const words = [makeWord('w1'), makeWord('w2')]
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ session: makeSession(), words, needs_generation: false }),
      })

      await useSessionStore.getState().fetchSession()
      expect(useSessionStore.getState().session?.id).toBe('session-1')
      expect(useSessionStore.getState().words).toHaveLength(2)
    })

    it('auto-chains generateWords when needs_generation=true', async () => {
      // First call: fetchSession
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ session: makeSession(), words: [], needs_generation: true }),
      })
      // Second call: generateWords
      const generatedWords = [makeWord('g1')]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ words: generatedWords }),
      })

      await useSessionStore.getState().fetchSession()
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(useSessionStore.getState().words).toHaveLength(1)
    })

    it('sets error on fetch failure', async () => {
      mockFetch.mockResolvedValue({ ok: false })

      await useSessionStore.getState().fetchSession()
      expect(useSessionStore.getState().error).toBe('Failed to fetch session')
    })

    it('sets error on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      await useSessionStore.getState().fetchSession()
      expect(useSessionStore.getState().error).toBe('Network error')
    })
  })

  // -------------------------------------------------------------------
  // generateWords
  // -------------------------------------------------------------------
  describe('generateWords', () => {
    it('sets isGenerating=true during generation', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ words: [] }),
      })

      const promise = useSessionStore.getState().generateWords('session-1')
      expect(useSessionStore.getState().isGenerating).toBe(true)
      await promise
      expect(useSessionStore.getState().isGenerating).toBe(false)
    })

    it('sets words on success', async () => {
      const words = [makeWord('g1'), makeWord('g2')]
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ words }),
      })

      await useSessionStore.getState().generateWords('session-1')
      expect(useSessionStore.getState().words).toHaveLength(2)
    })

    it('sets error on failure', async () => {
      mockFetch.mockResolvedValue({ ok: false })

      await useSessionStore.getState().generateWords('session-1')
      expect(useSessionStore.getState().error).toBe('Failed to generate words')
    })
  })

  // -------------------------------------------------------------------
  // markWordLearned (optimistic update)
  // -------------------------------------------------------------------
  describe('markWordLearned', () => {
    beforeEach(() => {
      useSessionStore.setState({
        session: makeSession({ word_count: 3, words_completed: 0 }),
        words: [makeWord('w1'), makeWord('w2'), makeWord('w3')],
        currentIndex: 0,
      })
    })

    it('optimistically updates word.is_learned to true', async () => {
      mockFetch.mockResolvedValue({ ok: true })

      await useSessionStore.getState().markWordLearned('w1')
      const word = useSessionStore.getState().words.find(w => w.id === 'w1')
      expect(word?.is_learned).toBe(true)
    })

    it('increments session.words_completed', async () => {
      mockFetch.mockResolvedValue({ ok: true })

      await useSessionStore.getState().markWordLearned('w1')
      expect(useSessionStore.getState().session?.words_completed).toBe(1)
    })

    it('auto-advances currentIndex', async () => {
      mockFetch.mockResolvedValue({ ok: true })

      await useSessionStore.getState().markWordLearned('w1')
      expect(useSessionStore.getState().currentIndex).toBe(1)
    })

    it('does not advance past last word', async () => {
      useSessionStore.setState({ currentIndex: 2 })
      mockFetch.mockResolvedValue({ ok: true })

      await useSessionStore.getState().markWordLearned('w3')
      expect(useSessionStore.getState().currentIndex).toBe(2)
    })

    it('sets session.is_completed when all words learned', async () => {
      useSessionStore.setState({
        session: makeSession({ word_count: 3, words_completed: 2 }),
        currentIndex: 2,
      })
      mockFetch.mockResolvedValue({ ok: true })

      await useSessionStore.getState().markWordLearned('w3')
      expect(useSessionStore.getState().session?.is_completed).toBe(true)
    })

    it('reverts on API failure', async () => {
      mockFetch.mockResolvedValue({ ok: false })

      await useSessionStore.getState().markWordLearned('w1')
      // Reverted: word should be not learned, session unchanged
      const word = useSessionStore.getState().words.find(w => w.id === 'w1')
      expect(word?.is_learned).toBe(false)
      expect(useSessionStore.getState().session?.words_completed).toBe(0)
    })

    it('sets error on API failure', async () => {
      mockFetch.mockResolvedValue({ ok: false })

      await useSessionStore.getState().markWordLearned('w1')
      expect(useSessionStore.getState().error).toBe('Failed to mark word as learned')
    })
  })

  // -------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------
  describe('navigation', () => {
    beforeEach(() => {
      useSessionStore.setState({
        words: [makeWord('w1'), makeWord('w2'), makeWord('w3')],
        currentIndex: 1,
      })
    })

    it('nextWord increments currentIndex', () => {
      useSessionStore.getState().nextWord()
      expect(useSessionStore.getState().currentIndex).toBe(2)
    })

    it('nextWord does not go past last index', () => {
      useSessionStore.setState({ currentIndex: 2 })
      useSessionStore.getState().nextWord()
      expect(useSessionStore.getState().currentIndex).toBe(2)
    })

    it('previousWord decrements currentIndex', () => {
      useSessionStore.getState().previousWord()
      expect(useSessionStore.getState().currentIndex).toBe(0)
    })

    it('previousWord does not go below 0', () => {
      useSessionStore.setState({ currentIndex: 0 })
      useSessionStore.getState().previousWord()
      expect(useSessionStore.getState().currentIndex).toBe(0)
    })
  })

  // -------------------------------------------------------------------
  // restartSession & reset
  // -------------------------------------------------------------------
  describe('restartSession', () => {
    it('resets currentIndex to 0 and sets isPracticing=true', () => {
      useSessionStore.setState({ currentIndex: 5, isPracticing: false })
      useSessionStore.getState().restartSession()
      expect(useSessionStore.getState().currentIndex).toBe(0)
      expect(useSessionStore.getState().isPracticing).toBe(true)
    })
  })

  describe('reset', () => {
    it('resets all state to initial values', () => {
      useSessionStore.setState({
        session: makeSession(),
        words: [makeWord('w1')],
        currentIndex: 5,
        isLoading: true,
        error: 'some error',
      })
      useSessionStore.getState().reset()
      const state = useSessionStore.getState()
      expect(state.session).toBeNull()
      expect(state.words).toHaveLength(0)
      expect(state.currentIndex).toBe(0)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
