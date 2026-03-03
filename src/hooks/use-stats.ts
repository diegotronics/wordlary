'use client'
import useSWR from 'swr'

interface Stats {
  totalWordsLearned: number
  currentStreak: number
  longestStreak: number
  wordsDueToday: number
  wordsByInterest: { interest_slug: string; count: number }[]
  totalSessions: number
  averageAccuracy: number
}

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error('stats')
      return r.json()
    })
    .then((data) => {
      const wordsByInterest = data.words_by_interest
        ? Object.entries(data.words_by_interest).map(([slug, count]) => ({
            interest_slug: slug,
            count: count as number,
          }))
        : []

      return {
        totalWordsLearned: data.total_words_learned ?? 0,
        currentStreak: data.current_streak ?? 0,
        longestStreak: data.longest_streak ?? 0,
        wordsDueToday: data.words_due_for_review ?? 0,
        wordsByInterest,
        totalSessions: data.total_sessions_completed ?? 0,
        averageAccuracy: data.average_review_accuracy
          ? Math.round(data.average_review_accuracy * 100)
          : 0,
      } satisfies Stats
    })

export function useStats() {
  const { data: stats, isLoading } = useSWR<Stats>('/api/stats', fetcher, {
    dedupingInterval: 30000,
  })

  return { stats: stats ?? null, isLoading }
}
