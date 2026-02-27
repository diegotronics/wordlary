'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useWords, type WordsFilters } from '@/hooks/use-words'
import { WordsToolbar } from '@/components/words/words-toolbar'
import { WordsTable } from '@/components/words/words-table'
import { WordsPaginationBar } from '@/components/words/words-pagination'

const DEFAULT_FILTERS: WordsFilters = {
  q: '',
  interest: '',
  learned: '',
  sort: 'created_at',
  order: 'desc',
  page: 1,
}

export default function WordsPage() {
  const t = useTranslations('words')
  const [filters, setFilters] = useState<WordsFilters>(DEFAULT_FILTERS)
  const { words, pagination, isLoading } = useWords(filters)

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  }

  const updateSort = (column: string) => {
    setFilters((prev) => {
      if (prev.sort === column) {
        return { ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' }
      }
      return { ...prev, sort: column, order: 'asc' }
    })
  }

  const updatePage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }

  const hasFilters = filters.q !== '' || filters.interest !== '' || filters.learned !== ''

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <WordsToolbar filters={filters} onFilterChange={updateFilter} />

      <WordsTable
        words={words}
        isLoading={isLoading}
        sort={filters.sort}
        order={filters.order}
        onSort={updateSort}
        hasFilters={hasFilters}
      />

      {!isLoading && pagination.totalPages > 1 && (
        <WordsPaginationBar pagination={pagination} onPageChange={updatePage} />
      )}
    </div>
  )
}
