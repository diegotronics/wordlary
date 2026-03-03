'use client'
import { create } from 'zustand'

export interface ReviewWord {
  id: string
  word: string
  ipa: string
  example_sentence: string
  word_es: string
  sentence_es: string
  audio_url: string | null
  review_schedule: {
    id: string
    repetition_number: number
    ease_factor: number
    interval_days: number
  }
}

export interface SessionStats {
  totalReviews: number
  againCount: number
  hardCount: number
  goodCount: number
  easyCount: number
}

export interface LastResult {
  quality: 0 | 1 | 3 | 5
  intervalDays: number
}

interface ReviewStore {
  wordsMap: Map<string, ReviewWord>
  queue: string[]
  isLoading: boolean
  isFlipped: boolean
  completedCount: number
  totalUniqueWords: number
  error: string | null
  isSubmitting: boolean
  lastResult: LastResult | null
  sessionStats: SessionStats
  seenIds: Set<string>

  fetchReviewWords: () => Promise<void>
  submitReview: (wordId: string, quality: 0 | 1 | 3 | 5) => Promise<void>
  flipCard: () => void
  reset: () => void
}

const initialSessionStats: SessionStats = {
  totalReviews: 0,
  againCount: 0,
  hardCount: 0,
  goodCount: 0,
  easyCount: 0,
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  wordsMap: new Map(),
  queue: [],
  isLoading: false,
  isFlipped: false,
  completedCount: 0,
  totalUniqueWords: 0,
  error: null,
  isSubmitting: false,
  lastResult: null,
  sessionStats: { ...initialSessionStats },
  seenIds: new Set(),

  fetchReviewWords: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/review')
      if (!response.ok) {
        throw new Error('Failed to fetch review words')
      }
      const data = await response.json()
      const reviews = data.reviews ?? []
      const wordsMap = new Map<string, ReviewWord>()
      const queue: string[] = []

      for (const r of reviews) {
        if (!r.learned_words) continue
        const lw = r.learned_words as Record<string, unknown>
        const id = lw.id as string
        wordsMap.set(id, {
          id,
          word: lw.word as string,
          ipa: (lw.ipa as string) || '',
          example_sentence: (lw.example_sentence as string) || '',
          word_es: (lw.word_es as string) || '',
          sentence_es: (lw.sentence_es as string) || '',
          audio_url: (lw.audio_url as string) || null,
          review_schedule: {
            id: r.id as string,
            repetition_number: r.repetition_number as number,
            ease_factor: r.ease_factor as number,
            interval_days: r.interval_days as number,
          },
        })
        queue.push(id)
      }

      set({
        wordsMap,
        queue,
        totalUniqueWords: wordsMap.size,
        completedCount: 0,
        sessionStats: { ...initialSessionStats },
        seenIds: new Set(),
        lastResult: null,
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch review words' })
    } finally {
      set({ isLoading: false })
    }
  },

  submitReview: async (wordId: string, quality: 0 | 1 | 3 | 5) => {
    if (get().isSubmitting) return
    set({ isSubmitting: true })

    try {
      const response = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word_id: wordId, quality }),
      })
      if (!response.ok) {
        throw new Error('Failed to submit review')
      }

      const data = await response.json()
      const intervalDays: number = data.schedule?.interval_days ?? 1

      // Show feedback
      set({ lastResult: { quality, intervalDays } })

      // Brief delay for feedback visibility
      await new Promise(resolve => setTimeout(resolve, 600))

      const { queue, completedCount, sessionStats, seenIds } = get()
      const newQueue = queue.slice(1)
      const newSeenIds = new Set(seenIds)
      newSeenIds.add(wordId)

      if (quality < 3) {
        // Re-queue failed words at the end
        newQueue.push(wordId)
      }

      set({
        queue: newQueue,
        completedCount: quality >= 3 ? completedCount + 1 : completedCount,
        isFlipped: false,
        lastResult: null,
        isSubmitting: false,
        seenIds: newSeenIds,
        sessionStats: {
          totalReviews: sessionStats.totalReviews + 1,
          againCount: sessionStats.againCount + (quality === 0 ? 1 : 0),
          hardCount: sessionStats.hardCount + (quality === 1 ? 1 : 0),
          goodCount: sessionStats.goodCount + (quality === 3 ? 1 : 0),
          easyCount: sessionStats.easyCount + (quality === 5 ? 1 : 0),
        },
      })
    } catch (error) {
      set({
        isSubmitting: false,
        lastResult: null,
        error: error instanceof Error ? error.message : 'Failed to submit review',
      })
    }
  },

  flipCard: () => {
    set({ isFlipped: !get().isFlipped })
  },

  reset: () => {
    set({
      wordsMap: new Map(),
      queue: [],
      isLoading: false,
      isFlipped: false,
      completedCount: 0,
      totalUniqueWords: 0,
      error: null,
      isSubmitting: false,
      lastResult: null,
      sessionStats: { ...initialSessionStats },
      seenIds: new Set(),
    })
  },
}))
