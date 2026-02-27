'use client'

import { BookOpen, RotateCcw, Target, Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface StatsOverviewProps {
  totalWords: number
  wordsDue: number
  accuracy: number
  totalSessions: number
}

export function StatsOverview({ totalWords, wordsDue, accuracy, totalSessions }: StatsOverviewProps) {
  const t = useTranslations('stats')
  const values: Record<string, number> = { totalWords, wordsDue, accuracy, totalSessions }

  const statItems = [
    { key: 'totalWords', label: t('wordsLearned'), icon: BookOpen, color: 'text-blue-500 bg-blue-100' },
    { key: 'wordsDue', label: t('dueForReview'), icon: RotateCcw, color: 'text-amber-500 bg-amber-100' },
    { key: 'accuracy', label: t('accuracy'), icon: Target, color: 'text-green-500 bg-green-100', suffix: '%' },
    { key: 'totalSessions', label: t('sessions'), icon: Calendar, color: 'text-purple-500 bg-purple-100' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {statItems.map((item) => (
        <div key={item.key} className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.color}`}>
              <item.icon className="h-4 w-4" />
            </div>
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {values[item.key]}
            {item.suffix || ''}
          </p>
        </div>
      ))}
    </div>
  )
}
