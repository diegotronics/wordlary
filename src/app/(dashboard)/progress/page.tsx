'use client'

import { useStats } from '@/hooks/use-stats'
import { StreakDisplay } from '@/components/dashboard/streak-display'
import { StatsOverview } from '@/components/dashboard/stats-overview'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { INTEREST_EMOJI } from '@/lib/constants'
import { useTranslations } from 'next-intl'

export default function ProgressPage() {
  const { stats, isLoading } = useStats()
  const t = useTranslations('progress')
  const ti = useTranslations('interests')

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
        <p className="text-muted-foreground">{t('unableToLoad')}</p>
      </div>
    )
  }

  const interestMap = INTEREST_EMOJI

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

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
            <CardTitle className="text-lg">{t('wordsByTopic')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.wordsByInterest.map((item: { interest_slug: string; count: number }) => {
              const emoji = interestMap[item.interest_slug] ?? ''
              const maxCount = Math.max(...stats.wordsByInterest.map((w: { count: number }) => w.count))
              const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0
              return (
                <div key={item.interest_slug} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {emoji} {ti.has(item.interest_slug) ? ti(item.interest_slug as Parameters<typeof ti>[0]) : item.interest_slug}
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
