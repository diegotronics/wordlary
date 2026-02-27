'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Volume2 } from 'lucide-react'

interface WordCardProps {
  word: string
  ipa: string
  exampleSentence: string
  wordEs: string
  sentenceEs: string
  interestSlug: string
  isLearned: boolean
}

export function WordCard({
  word,
  ipa,
  exampleSentence,
  wordEs,
  sentenceEs,
  interestSlug,
  isLearned,
}: WordCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div
      className="perspective-1000 mx-auto h-[320px] w-full max-w-sm cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {/* Front - English */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 bg-card p-6 shadow-lg"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {isLearned && (
            <div className="absolute right-4 top-4 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Learned
            </div>
          )}
          <span className="mb-1 rounded-full bg-muted px-3 py-0.5 text-xs text-muted-foreground">
            {interestSlug}
          </span>
          <h2 className="mt-3 text-3xl font-bold">{word}</h2>
          <p className="mt-1 text-lg text-muted-foreground">{ipa}</p>
          <div className="mt-6 rounded-lg bg-muted/50 p-3">
            <p className="text-center text-sm leading-relaxed">&ldquo;{exampleSentence}&rdquo;</p>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Tap to see translation</p>
        </div>

        {/* Back - Spanish */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 shadow-lg"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="mb-1 text-xs text-muted-foreground">Traduccion</span>
          <h2 className="mt-2 text-3xl font-bold text-primary">{wordEs}</h2>
          <div className="mt-6 rounded-lg bg-background/80 p-3">
            <p className="text-center text-sm leading-relaxed">&ldquo;{sentenceEs}&rdquo;</p>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Tap to see English</p>
        </div>
      </motion.div>
    </div>
  )
}
