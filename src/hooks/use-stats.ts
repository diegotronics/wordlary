'use client'
import { useState, useEffect } from 'react'

interface Stats {
  totalWordsLearned: number
  currentStreak: number
  longestStreak: number
  wordsDueToday: number
  wordsByInterest: { interest_slug: string; count: number }[]
  totalSessions: number
  averageAccuracy: number
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => {
        if (!r.ok) throw new Error('stats')
        return r.json()
      })
      .then((data) => {
        // Map snake_case API response to camelCase
        const wordsByInterest = data.words_by_interest
          ? Object.entries(data.words_by_interest).map(([slug, count]) => ({
              interest_slug: slug,
              count: count as number,
            }))
          : []

        setStats({
          totalWordsLearned: data.total_words_learned ?? 0,
          currentStreak: data.current_streak ?? 0,
          longestStreak: data.longest_streak ?? 0,
          wordsDueToday: data.words_due_for_review ?? 0,
          wordsByInterest,
          totalSessions: data.total_sessions_completed ?? 0,
          averageAccuracy: data.average_review_accuracy
            ? Math.round(data.average_review_accuracy * 100)
            : 0,
        })
      })
      .catch(() => {/* stats stays null */})
      .finally(() => setIsLoading(false))
  }, [])

  return { stats, isLoading }
}
