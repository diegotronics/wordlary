'use client'
import { create } from 'zustand'

interface Word {
  id: string
  word: string
  ipa: string
  example_sentence: string
  word_es: string
  sentence_es: string
  interest_slug: string
  is_learned: boolean
}

interface Session {
  id: string
  session_date: string
  word_count: number
  words_completed: number
  is_completed: boolean
}

interface SessionStore {
  session: Session | null
  words: Word[]
  currentIndex: number
  isLoading: boolean
  isGenerating: boolean
  isPracticing: boolean
  error: string | null

  fetchSession: () => Promise<void>
  generateWords: (sessionId: string) => Promise<void>
  markWordLearned: (wordId: string) => Promise<void>
  nextWord: () => void
  previousWord: () => void
  restartSession: () => void
  reset: () => void
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  session: null,
  words: [],
  currentIndex: 0,
  isLoading: false,
  isGenerating: false,
  isPracticing: false,
  error: null,

  fetchSession: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/session')
      if (!response.ok) {
        throw new Error('Failed to fetch session')
      }
      const data = await response.json()
      set({ session: data.session, words: data.words ?? [] })

      if (data.needs_generation && data.session?.id) {
        await get().generateWords(data.session.id)
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch session' })
    } finally {
      set({ isLoading: false })
    }
  },

  generateWords: async (sessionId: string) => {
    set({ isGenerating: true, error: null })
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      if (!response.ok) {
        throw new Error('Failed to generate words')
      }
      const data = await response.json()
      set({ words: data.words ?? [] })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to generate words' })
    } finally {
      set({ isGenerating: false })
    }
  },

  markWordLearned: async (wordId: string) => {
    const { words, session } = get()

    // Optimistic UI update + auto-advance
    const updatedWords = words.map((w) =>
      w.id === wordId ? { ...w, is_learned: true } : w
    )
    const wordsCompleted = (session?.words_completed ?? 0) + 1
    const isCompleted = session ? wordsCompleted >= session.word_count : false
    const { currentIndex } = get()
    const nextIndex = currentIndex < words.length - 1 ? currentIndex + 1 : currentIndex

    set({
      words: updatedWords,
      currentIndex: nextIndex,
      session: session
        ? { ...session, words_completed: wordsCompleted, is_completed: isCompleted }
        : null,
    })

    try {
      const response = await fetch(`/api/words/${wordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_learned: true }),
      })
      if (!response.ok) {
        // Revert on failure
        set({ words, session })
        throw new Error('Failed to mark word as learned')
      }
    } catch (error) {
      set({
        words,
        session,
        error: error instanceof Error ? error.message : 'Failed to mark word as learned',
      })
    }
  },

  nextWord: () => {
    const { currentIndex, words } = get()
    if (currentIndex < words.length - 1) {
      set({ currentIndex: currentIndex + 1 })
    }
  },

  previousWord: () => {
    const { currentIndex } = get()
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 })
    }
  },

  restartSession: () => {
    set({ currentIndex: 0, isPracticing: true })
  },

  reset: () => {
    set({
      session: null,
      words: [],
      currentIndex: 0,
      isLoading: false,
      isGenerating: false,
      isPracticing: false,
      error: null,
    })
  },
}))
