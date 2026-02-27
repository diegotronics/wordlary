'use client'

import { DailySession } from '@/components/session/daily-session'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function SessionPage() {
  const t = useTranslations('session')

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToHome')}
        </Link>
      </Button>

      <DailySession />
    </div>
  )
}
