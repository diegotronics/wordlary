'use client'

import { Progress } from '@/components/ui/progress'
import { useTranslations } from 'next-intl'

interface SessionProgressProps {
  current: number
  total: number
  completed: number
}

export function SessionProgress({ current, total, completed }: SessionProgressProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0
  const t = useTranslations('session')

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {t('wordOf', { current: current + 1, total })}
        </span>
        <span className="font-medium">
          {t('learned', { count: completed })}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}
