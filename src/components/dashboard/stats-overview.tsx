'use client'

import { BookOpen, RotateCcw, Target, Calendar } from 'lucide-react'

interface StatsOverviewProps {
  totalWords: number
  wordsDue: number
  accuracy: number
  totalSessions: number
}

const statItems = [
  { key: 'totalWords', label: 'Words Learned', icon: BookOpen, color: 'text-blue-500 bg-blue-100' },
  { key: 'wordsDue', label: 'Due for Review', icon: RotateCcw, color: 'text-amber-500 bg-amber-100' },
  { key: 'accuracy', label: 'Accuracy', icon: Target, color: 'text-green-500 bg-green-100', suffix: '%' },
  { key: 'totalSessions', label: 'Sessions', icon: Calendar, color: 'text-purple-500 bg-purple-100' },
]

export function StatsOverview({ totalWords, wordsDue, accuracy, totalSessions }: StatsOverviewProps) {
  const values: Record<string, number> = { totalWords, wordsDue, accuracy, totalSessions }

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
