'use client'

import { useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useReview } from '@/hooks/use-review'
import { ReviewCard } from '@/components/review/review-card'
import { DifficultyButtons } from '@/components/review/difficulty-buttons'
import { ReviewComplete } from '@/components/review/review-complete'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function ReviewPage() {
  const {
    currentWord,
    isLoading,
    isFlipped,
    isSubmitting,
    completedCount,
    totalUniqueWords,
    requeuedCount,
    isSessionComplete,
    lastResult,
    sessionStats,
    error,
    appearanceCount,
    submitReview,
    flipCard,
  } = useReview()
  const t = useTranslations('review')

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return
      if (!currentWord || isSessionComplete) return

      if ((e.code === 'Space' || e.code === 'Enter') && !isFlipped && !isSubmitting) {
        e.preventDefault()
        flipCard()
        return
      }

      if (isFlipped && !isSubmitting) {
        const keyMap: Record<string, 0 | 1 | 3 | 5> = {
          '1': 0,
          '2': 1,
          '3': 3,
          '4': 5,
        }
        if (e.key in keyMap) {
          e.preventDefault()
          submitReview(currentWord.id, keyMap[e.key])
        }
      }
    },
    [currentWord, isFlipped, isSubmitting, isSessionComplete, flipCard, submitReview],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="mx-auto h-[320px] w-full max-w-sm rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-4 md:p-6">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (totalUniqueWords === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex flex-col items-center gap-4 py-12">
          <RotateCcw className="h-12 w-12 text-muted-foreground/50" />
          <div className="text-center">
            <p className="font-medium">{t('noWords')}</p>
            <p className="text-sm text-muted-foreground">{t('noWordsHint')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (isSessionComplete) {
    return (
      <div className="mx-auto max-w-2xl p-4 md:p-6">
        <ReviewComplete sessionStats={sessionStats} totalUniqueWords={totalUniqueWords} />
      </div>
    )
  }

  if (!currentWord) return null

  const progressPercent =
    totalUniqueWords > 0 ? (completedCount / totalUniqueWords) * 100 : 0

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('reviewedOf', { completed: completedCount, total: totalUniqueWords })}
          </p>
          {requeuedCount > 0 && (
            <Badge variant="outline" className="border-orange-200 text-orange-500">
              {t('againWords')}: {requeuedCount}
            </Badge>
          )}
        </div>
      </div>

      <Progress value={progressPercent} className="h-2" />

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentWord.id}-${appearanceCount}`}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <ReviewCard
              word={currentWord.word}
              ipa={currentWord.ipa}
              exampleSentence={currentWord.example_sentence}
              wordEs={currentWord.word_es}
              sentenceEs={currentWord.sentence_es}
              isFlipped={isFlipped}
              onFlip={isSubmitting ? () => {} : flipCard}
            />
          </motion.div>
        </AnimatePresence>

        {/* Feedback overlay */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center"
            >
              <div className="mx-auto flex h-[320px] w-full max-w-sm items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm">
                {lastResult.quality < 3 ? (
                  <p className="text-sm font-medium text-orange-500">
                    {t('requeued')}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-green-500">
                    {t('nextIn', { interval: `${lastResult.intervalDays}d` })}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isFlipped && !lastResult && (
        <div className="mx-auto max-w-sm">
          <DifficultyButtons
            onRate={(q) => submitReview(currentWord.id, q)}
            disabled={isSubmitting}
            currentSchedule={{
              repetitionNumber: currentWord.review_schedule.repetition_number,
              easeFactor: currentWord.review_schedule.ease_factor,
              intervalDays: currentWord.review_schedule.interval_days,
            }}
          />
        </div>
      )}

      {!isFlipped && !lastResult && (
        <p className="text-center text-sm text-muted-foreground">
          {t('tapCard')}
        </p>
      )}
    </div>
  )
}
