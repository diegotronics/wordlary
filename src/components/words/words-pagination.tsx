'use client'

import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { WordsPagination } from '@/hooks/use-words'

interface WordsPaginationProps {
  pagination: WordsPagination
  onPageChange: (page: number) => void
}

export function WordsPaginationBar({ pagination, onPageChange }: WordsPaginationProps) {
  const t = useTranslations('words')

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {t('showingCount', { count: pagination.total })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          {t('previous')}
        </Button>
        <span className="text-sm text-muted-foreground">
          {t('pageOf', { page: pagination.page, total: pagination.totalPages })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
        >
          {t('next')}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
