'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Home, BarChart3, Target, Zap, RotateCcw, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { SessionStats } from '@/stores/review-store'

interface ReviewCompleteProps {
  sessionStats: SessionStats
  totalUniqueWords: number
}

export function ReviewComplete({ sessionStats, totalUniqueWords }: ReviewCompleteProps) {
  const t = useTranslations('review')

  const accuracy =
    sessionStats.totalReviews > 0
      ? Math.round(
          ((sessionStats.goodCount + sessionStats.easyCount) /
            sessionStats.totalReviews) *
            100,
        )
      : 0

  const needsWorkCount = sessionStats.againCount + sessionStats.hardCount

  const motivationalMessage =
    accuracy >= 90
      ? t('perfectSession')
      : accuracy >= 70
        ? t('greatSession')
        : t('keepPracticing')

  const stats = [
    {
      label: t('totalReviews'),
      value: sessionStats.totalReviews,
      icon: RotateCcw,
      color: 'text-blue-500',
    },
    {
      label: t('sessionAccuracy'),
      value: `${accuracy}%`,
      icon: Target,
      color: accuracy >= 70 ? 'text-green-500' : 'text-orange-500',
    },
    {
      label: t('easy'),
      value: sessionStats.easyCount,
      icon: Zap,
      color: 'text-green-500',
    },
    {
      label: t('needsWork'),
      value: needsWorkCount,
      icon: AlertCircle,
      color: needsWorkCount > 0 ? 'text-orange-500' : 'text-green-500',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center"
    >
      <Card className="w-full max-w-sm text-center">
        <CardContent className="space-y-6 pt-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          </motion.div>

          <div>
            <h2 className="text-2xl font-bold">{t('reviewsDone')}</h2>
            <p className="mt-2 text-muted-foreground">
              {t('reviewedWords', { count: totalUniqueWords })}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3"
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-xl font-bold">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </motion.div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">{motivationalMessage}</p>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                {t('backToHome')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/progress">
                <BarChart3 className="mr-2 h-4 w-4" />
                {t('viewProgress')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
