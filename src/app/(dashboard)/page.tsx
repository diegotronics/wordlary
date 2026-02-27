'use client'

import { StreakDisplay } from '@/components/dashboard/streak-display'
import { useStats } from '@/hooks/use-stats'
import { useSessionStatus } from '@/hooks/use-session-status'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { RotateCcw, Play, CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function DashboardPage() {
  const { stats, isLoading: statsLoading } = useStats()
  const { status, isLoading: sessionLoading } = useSessionStatus()
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
      {statsLoading ? (
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

      {/* Session Status Card */}
      {sessionLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : status ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            {status.isCompleted ? (
              <>
                <CheckCircle2 className="h-10 w-10 text-green-500" />
                <div className="text-center">
                  <p className="font-medium">{t('sessionDone')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('sessionDoneMessage', { count: status.wordsCompleted })}
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/session">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {t('practiceAgain')}
                  </Link>
                </Button>
              </>
            ) : status.wordsCompleted > 0 ? (
              <>
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('inProgress')}
                    </span>
                    <span className="font-medium">
                      {status.wordsCompleted}/{status.wordCount}
                    </span>
                  </div>
                  <Progress value={(status.wordsCompleted / status.wordCount) * 100} className="h-2" />
                </div>
                <Button asChild size="lg" className="w-full">
                  <Link href="/session">
                    <Play className="mr-2 h-4 w-4" />
                    {t('continuePractice')}
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <div className="text-center">
                  <p className="font-medium">{t('readyToLearn')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('readyToLearnMessage', { count: status.wordCount })}
                  </p>
                </div>
                <Button asChild size="lg" className="w-full">
                  <Link href="/session">
                    <Play className="mr-2 h-4 w-4" />
                    {t('startPractice')}
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
