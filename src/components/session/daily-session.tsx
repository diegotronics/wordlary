'use client'

import { useSession } from '@/hooks/use-session'
import { WordCard } from './word-card'
import { SessionProgress } from './session-progress'
import { SessionComplete } from './session-complete'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function DailySession() {
  const {
    session,
    words,
    currentIndex,
    isLoading,
    isGenerating,
    isPracticing,
    error,
    markWordLearned,
    nextWord,
    previousWord,
    restartSession,
  } = useSession()
  const t = useTranslations('session')
  const tc = useTranslations('common')

  if (isLoading || isGenerating) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="flex justify-center">
          <Skeleton className="h-[320px] w-full max-w-sm rounded-2xl" />
        </div>
        {isGenerating && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('generating')}</span>
          </div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          {tc('tryAgain')}
        </Button>
      </div>
    )
  }

  if (!session || words.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">{t('noSession')}</p>
      </div>
    )
  }

  if (session.is_completed && !isPracticing) {
    return <SessionComplete wordsLearned={session.words_completed} onPracticeAgain={restartSession} />
  }

  const currentWord = words[currentIndex]
  if (!currentWord) return null

  return (
    <div className="space-y-6">
      <SessionProgress
        current={currentIndex}
        total={words.length}
        completed={session.words_completed}
      />

      <WordCard
        key={currentWord.id}
        id={currentWord.id}
        word={currentWord.word}
        ipa={currentWord.ipa}
        exampleSentence={currentWord.example_sentence}
        wordEs={currentWord.word_es}
        sentenceEs={currentWord.sentence_es}
        interestSlug={currentWord.interest_slug}
        isLearned={currentWord.is_learned}
      />

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={previousWord}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {!currentWord.is_learned && (
          <Button onClick={() => markWordLearned(currentWord.id)} className="px-6">
            <Check className="mr-2 h-4 w-4" />
            {t('markAsLearned')}
          </Button>
        )}

        {currentWord.is_learned && (
          <Button variant="secondary" disabled className="px-6">
            <Check className="mr-2 h-4 w-4" />
            {t('learnedBadge')}
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={nextWord}
          disabled={currentIndex === words.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
