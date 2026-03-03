'use client'
import { useEffect, useMemo } from 'react'
import { useReviewStore } from '@/stores/review-store'

export function useReview() {
  const store = useReviewStore()

  useEffect(() => {
    store.fetchReviewWords()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const currentWord = useMemo(() => {
    const firstId = store.queue[0]
    return firstId ? store.wordsMap.get(firstId) ?? null : null
  }, [store.queue, store.wordsMap])

  const requeuedCount = useMemo(() => {
    // Count IDs in queue that have already been seen (i.e., re-queued words)
    return store.queue.filter(id => store.seenIds.has(id)).length
  }, [store.queue, store.seenIds])

  const isSessionComplete = store.queue.length === 0 && !store.isLoading && store.totalUniqueWords > 0

  const appearanceCount = useMemo(() => {
    // How many times the current word has been seen (for AnimatePresence key)
    const firstId = store.queue[0]
    if (!firstId) return 0
    return store.sessionStats.totalReviews
  }, [store.queue, store.sessionStats.totalReviews])

  return {
    currentWord,
    isLoading: store.isLoading,
    isFlipped: store.isFlipped,
    isSubmitting: store.isSubmitting,
    completedCount: store.completedCount,
    totalUniqueWords: store.totalUniqueWords,
    requeuedCount,
    isSessionComplete,
    lastResult: store.lastResult,
    sessionStats: store.sessionStats,
    error: store.error,
    appearanceCount,
    submitReview: store.submitReview,
    flipCard: store.flipCard,
    reset: store.reset,
  }
}
