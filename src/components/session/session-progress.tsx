'use client'

import { Progress } from '@/components/ui/progress'

interface SessionProgressProps {
  current: number
  total: number
  completed: number
}

export function SessionProgress({ current, total, completed }: SessionProgressProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Word {current + 1} of {total}
        </span>
        <span className="font-medium">
          {completed} learned
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}
