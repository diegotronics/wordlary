'use client'

import { useStats } from '@/hooks/use-stats'
import { StreakDisplay } from '@/components/dashboard/streak-display'
import { StatsOverview } from '@/components/dashboard/stats-overview'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { INTERESTS } from '@/lib/constants'

export default function ProgressPage() {
  const { stats, isLoading } = useStats()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="mx-auto max-w-2xl p-4 md:p-6">
        <p className="text-muted-foreground">Unable to load progress.</p>
      </div>
    )
  }

  const interestMap = Object.fromEntries(
    INTERESTS.map((i) => [i.slug, { name: i.name, emoji: i.emoji }])
  )

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">Progress</h1>

      <StreakDisplay current={stats.currentStreak} longest={stats.longestStreak} />

      <StatsOverview
        totalWords={stats.totalWordsLearned}
        wordsDue={stats.wordsDueToday}
        accuracy={stats.averageAccuracy}
        totalSessions={stats.totalSessions}
      />

      {stats.wordsByInterest && stats.wordsByInterest.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Words by Topic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.wordsByInterest.map((item: { interest_slug: string; count: number }) => {
              const info = interestMap[item.interest_slug]
              const maxCount = Math.max(...stats.wordsByInterest.map((w: { count: number }) => w.count))
              const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0
              return (
                <div key={item.interest_slug} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {info?.emoji || ''} {info?.name || item.interest_slug}
                    </span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
