'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Home, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface ReviewCompleteProps {
  totalReviewed: number
}

export function ReviewComplete({ totalReviewed }: ReviewCompleteProps) {
  const t = useTranslations('review')

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
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          </motion.div>

          <div>
            <h2 className="text-2xl font-bold">{t('reviewsDone')}</h2>
            <p className="mt-2 text-muted-foreground">
              {t('reviewedWords', { count: totalReviewed })}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                {t('backToHome')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/progress">
                <BarChart3 className="mr-2 h-4 w-4" />
                {t('viewProgress')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
