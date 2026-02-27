'use client'
import { useEffect } from 'react'
import { useReviewStore } from '@/stores/review-store'

export function useReview() {
  const store = useReviewStore()

  useEffect(() => {
    store.fetchReviewWords()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return store
}
