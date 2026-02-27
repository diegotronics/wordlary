'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PartyPopper, RotateCcw, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface SessionCompleteProps {
  wordsLearned: number
}

export function SessionComplete({ wordsLearned }: SessionCompleteProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center"
    >
      <Card className="w-full max-w-sm text-center">
        <CardContent className="space-y-6 pt-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <PartyPopper className="mx-auto h-16 w-16 text-primary" />
          </motion.div>

          <div>
            <h2 className="text-2xl font-bold">Session Complete!</h2>
            <p className="mt-2 text-muted-foreground">
              You learned <span className="font-semibold text-foreground">{wordsLearned}</span> new
              words today. Great work!
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Come back tomorrow for new words. Your learned words will appear in review sessions
            based on spaced repetition.
          </p>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/review">
                <RotateCcw className="mr-2 h-4 w-4" />
                Review Words
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/progress">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Progress
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
