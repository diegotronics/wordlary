'use client'

import { Flame } from 'lucide-react'

interface StreakDisplayProps {
  current: number
  longest: number
}

export function StreakDisplay({ current, longest }: StreakDisplayProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
        <Flame className="h-6 w-6 text-orange-500" />
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{current}</span>
          <span className="text-sm text-muted-foreground">day streak</span>
        </div>
        <p className="text-xs text-muted-foreground">Best: {longest} days</p>
      </div>
    </div>
  )
}
