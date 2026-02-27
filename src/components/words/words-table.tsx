'use client'

import { useTranslations } from 'next-intl'
import { ArrowUpDown, ArrowUp, ArrowDown, BookA } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { INTERESTS } from '@/lib/constants'
import type { WordItem } from '@/hooks/use-words'

const interestMap = new Map<string, string>(
  INTERESTS.map((i) => [i.slug, i.emoji])
)

interface WordsTableProps {
  words: WordItem[]
  isLoading: boolean
  sort: string
  order: 'asc' | 'desc'
  onSort: (column: string) => void
  hasFilters: boolean
}

function SortIcon({ column, activeSort, activeOrder }: { column: string; activeSort: string; activeOrder: string }) {
  if (column !== activeSort) return <ArrowUpDown className="h-3.5 w-3.5" />
  return activeOrder === 'asc'
    ? <ArrowUp className="h-3.5 w-3.5" />
    : <ArrowDown className="h-3.5 w-3.5" />
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function WordsTable({ words, isLoading, sort, order, onSort, hasFilters }: WordsTableProps) {
  const t = useTranslations('words')
  const ti = useTranslations('interests')

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (words.length === 0) {
    return <EmptyState hasFilters={hasFilters} />
  }

  return (
    <>
      {/* Desktop table */}
      <Card className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <SortableHeader
                  label={t('columnWord')}
                  column="word"
                  activeSort={sort}
                  activeOrder={order}
                  onSort={onSort}
                />
                <SortableHeader
                  label={t('columnTranslation')}
                  column="word_es"
                  activeSort={sort}
                  activeOrder={order}
                  onSort={onSort}
                />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('columnTopic')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('columnStatus')}
                </th>
                <SortableHeader
                  label={t('columnDate')}
                  column="created_at"
                  activeSort={sort}
                  activeOrder={order}
                  onSort={onSort}
                />
              </tr>
            </thead>
            <tbody>
              {words.map((word) => (
                <tr key={word.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{word.word}</div>
                    {word.ipa && (
                      <div className="text-xs text-muted-foreground">/{word.ipa}/</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {word.word_es ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {word.interest_slug && (
                      <Badge variant="secondary" className="font-normal">
                        {interestMap.get(word.interest_slug) ?? ''}{' '}
                        {ti(word.interest_slug)}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={word.is_learned ? 'default' : 'outline'}>
                      {word.is_learned ? t('learned') : t('inProgress')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(word.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {words.map((word) => (
          <Card key={word.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{word.word}</div>
                <div className="text-sm text-muted-foreground">{word.word_es ?? '—'}</div>
                {word.ipa && (
                  <div className="text-xs text-muted-foreground">/{word.ipa}/</div>
                )}
              </div>
              <Badge variant={word.is_learned ? 'default' : 'outline'} className="shrink-0">
                {word.is_learned ? t('learned') : t('inProgress')}
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              {word.interest_slug && (
                <span>
                  {interestMap.get(word.interest_slug) ?? ''} {ti(word.interest_slug)}
                </span>
              )}
              <span className="ml-auto">{formatDate(word.created_at)}</span>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}

function SortableHeader({
  label,
  column,
  activeSort,
  activeOrder,
  onSort,
}: {
  label: string
  column: string
  activeSort: string
  activeOrder: string
  onSort: (column: string) => void
}) {
  return (
    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
      <button
        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
        onClick={() => onSort(column)}
      >
        {label}
        <SortIcon column={column} activeSort={activeSort} activeOrder={activeOrder} />
      </button>
    </th>
  )
}

function LoadingSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20 ml-auto" />
          </div>
        ))}
      </div>
    </Card>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  const t = useTranslations('words')

  return (
    <Card className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <BookA className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium">
        {hasFilters ? t('noResults') : t('noWords')}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        {hasFilters ? t('noResultsHint') : t('noWordsHint')}
      </p>
    </Card>
  )
}
