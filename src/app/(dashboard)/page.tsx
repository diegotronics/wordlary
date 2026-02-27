'use client'

import { DailySession } from '@/components/session/daily-session'
import { StreakDisplay } from '@/components/dashboard/streak-display'
import { useStats } from '@/hooks/use-stats'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function DashboardPage() {
  const { stats, isLoading } = useStats()
  const t = useTranslations('dashboard')

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('todaysWords')}</h1>
          <p className="text-sm text-muted-foreground">{t('learnDaily')}</p>
        </div>
        {stats && stats.wordsDueToday > 0 && (
          <Link href="/review">
            <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
              <RotateCcw className="h-3 w-3" />
              {t('due', { count: stats.wordsDueToday })}
            </Badge>
          </Link>
        )}
      </div>

      {/* Stats row */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StreakDisplay
            current={stats.currentStreak}
            longest={stats.longestStreak}
          />
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <span className="text-lg font-bold text-blue-600">{stats.totalWordsLearned}</span>
            </div>
            <div>
              <p className="font-medium">{t('wordsLearned')}</p>
              <p className="text-xs text-muted-foreground">
                {t('sessionsCompleted', { count: stats.totalSessions })}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Daily Session */}
      <DailySession />
    </div>
  )
}
