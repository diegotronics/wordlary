'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { PronunciationButtons } from '@/components/shared/pronunciation-buttons'

interface ReviewCardProps {
  id: string
  word: string
  ipa: string
  exampleSentence: string
  wordEs: string
  sentenceEs: string
  isFlipped: boolean
  onFlip: () => void
  audioUrl?: string | null
}

export function ReviewCard({
  id,
  word,
  ipa,
  exampleSentence,
  wordEs,
  sentenceEs,
  isFlipped,
  onFlip,
  audioUrl,
}: ReviewCardProps) {
  const t = useTranslations('review')

  return (
    <div
      className="perspective-1000 relative mx-auto h-[320px] w-full max-w-sm cursor-pointer"
      onClick={onFlip}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 bg-card p-6 shadow-lg"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-xs text-muted-foreground">{t('doYouRemember')}</p>
          <h2 className="mt-4 text-3xl font-bold">{word}</h2>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-lg text-muted-foreground">{ipa}</p>
            <PronunciationButtons wordId={id} word={word} audioUrl={audioUrl} />
          </div>
          <div className="mt-6 rounded-lg bg-muted/50 p-3">
            <p className="text-center text-sm leading-relaxed">&ldquo;{exampleSentence}&rdquo;</p>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{t('tapToReveal')}</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 shadow-lg"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-xs text-muted-foreground">{t('translation')}</p>
          <h2 className="mt-4 text-3xl font-bold text-primary">{wordEs}</h2>
          <div className="mt-6 rounded-lg bg-background/80 p-3">
            <p className="text-center text-sm leading-relaxed">&ldquo;{sentenceEs}&rdquo;</p>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{t('rateMemory')}</p>
        </div>
      </motion.div>
    </div>
  )
}
