'use client'

import { useReview } from '@/hooks/use-review'
import { ReviewCard } from '@/components/review/review-card'
import { DifficultyButtons } from '@/components/review/difficulty-buttons'
import { ReviewComplete } from '@/components/review/review-complete'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function ReviewPage() {
  const {
    words,
    currentIndex,
    isLoading,
    isFlipped,
    completedCount,
    error,
    submitReview,
    flipCard,
  } = useReview()
  const t = useTranslations('review')

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[280px] w-full max-w-sm rounded-2xl mx-auto" />
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

  if (words.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex flex-col items-center gap-4 py-12">
          <RotateCcw className="h-12 w-12 text-muted-foreground/50" />
          <div className="text-center">
            <p className="font-medium">{t('noWords')}</p>
            <p className="text-sm text-muted-foreground">
              {t('noWordsHint')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (currentIndex >= words.length) {
    return (
      <div className="mx-auto max-w-2xl p-4 md:p-6">
        <ReviewComplete totalReviewed={completedCount} />
      </div>
    )
  }

  const currentWord = words[currentIndex]
  const progressPercent = (completedCount / words.length) * 100

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('reviewedOf', { completed: completedCount, total: words.length })}
        </p>
      </div>

      <Progress value={progressPercent} className="h-2" />

      <ReviewCard
        word={currentWord.word}
        ipa={currentWord.ipa}
        exampleSentence={currentWord.example_sentence}
        wordEs={currentWord.word_es}
        sentenceEs={currentWord.sentence_es}
        isFlipped={isFlipped}
        onFlip={flipCard}
      />

      {isFlipped && (
        <div className="mx-auto max-w-sm">
          <DifficultyButtons onRate={(q) => submitReview(currentWord.id, q)} />
        </div>
      )}

      {!isFlipped && (
        <p className="text-center text-sm text-muted-foreground">
          {t('tapCard')}
        </p>
      )}
    </div>
  )
}
