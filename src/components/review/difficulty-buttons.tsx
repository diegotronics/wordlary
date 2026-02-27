'use client'

import { Button } from '@/components/ui/button'

interface DifficultyButtonsProps {
  onRate: (quality: 0 | 1 | 3 | 5) => void
  disabled?: boolean
}

const buttons = [
  { quality: 0 as const, label: 'Again', description: 'Forgot', variant: 'destructive' as const },
  { quality: 1 as const, label: 'Hard', description: 'Struggled', variant: 'outline' as const },
  { quality: 3 as const, label: 'Good', description: 'Recalled', variant: 'outline' as const },
  { quality: 5 as const, label: 'Easy', description: 'Instant', variant: 'default' as const },
]

export function DifficultyButtons({ onRate, disabled }: DifficultyButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {buttons.map((btn) => (
        <Button
          key={btn.quality}
          variant={btn.variant}
          size="sm"
          onClick={() => onRate(btn.quality)}
          disabled={disabled}
          className="flex flex-col gap-0.5 py-3"
        >
          <span className="text-xs font-semibold">{btn.label}</span>
          <span className="text-[10px] opacity-70">{btn.description}</span>
        </Button>
      ))}
    </div>
  )
}
