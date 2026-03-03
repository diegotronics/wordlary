'use client'

import { Volume2, Volume1, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { usePronunciation } from '@/hooks/use-pronunciation'
import { useTranslations } from 'next-intl'

interface PronunciationButtonsProps {
  wordId: string
  word: string
  audioUrl?: string | null
}

const pulseAnimation = {
  scale: [1, 1.2, 1],
}

const pulseTransition = {
  repeat: Infinity,
  duration: 0.8,
  ease: 'easeInOut' as const,
}

export function PronunciationButtons({
  wordId,
  word,
  audioUrl,
}: PronunciationButtonsProps) {
  const {
    playNormal,
    playSlow,
    isPlayingNormal,
    isPlayingSlow,
    isLoading,
  } = usePronunciation({ wordId, word, audioUrl })
  const t = useTranslations('pronunciation')

  return (
    <div className="inline-flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={playNormal}
        aria-label={t('playNormal')}
        disabled={isLoading || isPlayingSlow}
        className="min-h-11 min-w-11 text-muted-foreground hover:text-foreground"
      >
        {isLoading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <motion.div
            animate={isPlayingNormal ? pulseAnimation : {}}
            transition={pulseTransition}
          >
            <Volume2
              className={`size-5 ${isPlayingNormal ? 'text-primary' : ''}`}
            />
          </motion.div>
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={playSlow}
        aria-label={t('playSlow')}
        disabled={isLoading || isPlayingNormal}
        className="min-h-11 min-w-11 text-muted-foreground hover:text-foreground"
      >
        <motion.div
          animate={isPlayingSlow ? pulseAnimation : {}}
          transition={{ ...pulseTransition, duration: 1.0 }}
        >
          <Volume1
            className={`size-5 ${isPlayingSlow ? 'text-primary' : ''}`}
          />
        </motion.div>
      </Button>
    </div>
  )
}
