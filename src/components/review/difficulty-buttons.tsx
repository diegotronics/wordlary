'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { calculateSM2 } from '@/lib/spaced-repetition/sm2'
import type { ReviewQuality } from '@/lib/types'

interface DifficultyButtonsProps {
  onRate: (quality: 0 | 1 | 3 | 5) => void
  disabled?: boolean
  currentSchedule: {
    repetitionNumber: number
    easeFactor: number
    intervalDays: number
  }
}

function formatInterval(days: number): string {
  if (days >= 30) {
    const months = Math.round(days / 30)
    return `~${months}m`
  }
  return `${days}d`
}

export function DifficultyButtons({ onRate, disabled, currentSchedule }: DifficultyButtonsProps) {
  const t = useTranslations('review')

  const buttons = [
    { quality: 0 as const, label: t('again'), description: t('forgot'), variant: 'destructive' as const },
    { quality: 1 as const, label: t('hard'), description: t('struggled'), variant: 'outline' as const },
    { quality: 3 as const, label: t('good'), description: t('recalled'), variant: 'outline' as const },
    { quality: 5 as const, label: t('easy'), description: t('instant'), variant: 'default' as const },
  ]

  const previews = buttons.map(btn => {
    const result = calculateSM2({
      quality: btn.quality as ReviewQuality,
      repetitionNumber: currentSchedule.repetitionNumber,
      easeFactor: currentSchedule.easeFactor,
      intervalDays: currentSchedule.intervalDays,
    })
    return result.intervalDays
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className="space-y-2"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {buttons.map((btn, i) => (
          <Button
            key={btn.quality}
            variant={btn.variant}
            onClick={() => onRate(btn.quality)}
            disabled={disabled}
            className="flex h-auto flex-col gap-1 py-4"
          >
            <span className="text-sm font-semibold">{btn.label}</span>
            <span className="text-xs opacity-60">{btn.description}</span>
            <span className="text-[11px] opacity-40">{formatInterval(previews[i])}</span>
          </Button>
        ))}
      </div>
      <p className="hidden text-center text-xs text-muted-foreground sm:block">
        {t('flipShortcut')} &middot; {t('ratingShortcuts')}
      </p>
    </motion.div>
  )
}
