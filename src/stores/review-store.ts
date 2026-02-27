'use client'
import { create } from 'zustand'

interface ReviewWord {
  id: string
  word: string
  ipa: string
  example_sentence: string
  word_es: string
  sentence_es: string
  review_schedule: {
    id: string
    repetition_number: number
    ease_factor: number
    interval_days: number
  }
}

interface ReviewStore {
  words: ReviewWord[]
  currentIndex: number
  isLoading: boolean
  isFlipped: boolean
  completedCount: number
  error: string | null

  fetchReviewWords: () => Promise<void>
  submitReview: (wordId: string, quality: 0 | 1 | 3 | 5) => Promise<void>
  flipCard: () => void
  reset: () => void
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  words: [],
  currentIndex: 0,
  isLoading: false,
  isFlipped: false,
  completedCount: 0,
  error: null,

  fetchReviewWords: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/review')
      if (!response.ok) {
        throw new Error('Failed to fetch review words')
      }
      const data = await response.json()
      // API returns { reviews: [...] } where each review has learned_words nested
      const reviews = data.reviews ?? []
      const words: ReviewWord[] = reviews
        .filter((r: Record<string, unknown>) => r.learned_words)
        .map((r: Record<string, unknown>) => {
          const lw = r.learned_words as Record<string, unknown>
          return {
            id: lw.id as string,
            word: lw.word as string,
            ipa: (lw.ipa as string) || '',
            example_sentence: (lw.example_sentence as string) || '',
            word_es: (lw.word_es as string) || '',
            sentence_es: (lw.sentence_es as string) || '',
            review_schedule: {
              id: r.id as string,
              repetition_number: r.repetition_number as number,
              ease_factor: r.ease_factor as number,
              interval_days: r.interval_days as number,
            },
          }
        })
      set({ words })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch review words' })
    } finally {
      set({ isLoading: false })
    }
  },

  submitReview: async (wordId: string, quality: 0 | 1 | 3 | 5) => {
    try {
      const response = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word_id: wordId, quality }),
      })
      if (!response.ok) {
        throw new Error('Failed to submit review')
      }

      const { currentIndex, completedCount } = get()
      const nextIndex = currentIndex + 1
      set({
        currentIndex: nextIndex,
        completedCount: completedCount + 1,
        isFlipped: false,
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to submit review' })
    }
  },

  flipCard: () => {
    set({ isFlipped: !get().isFlipped })
  },

  reset: () => {
    set({
      words: [],
      currentIndex: 0,
      isLoading: false,
      isFlipped: false,
      completedCount: 0,
      error: null,
    })
  },
}))
