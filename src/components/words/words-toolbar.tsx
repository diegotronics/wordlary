'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { INTEREST_SLUGS, INTEREST_EMOJI } from '@/lib/constants'

interface WordsToolbarProps {
  filters: {
    q: string
    interest: string
    learned: string
  }
  onFilterChange: (key: string, value: string) => void
}

export function WordsToolbar({ filters, onFilterChange }: WordsToolbarProps) {
  const t = useTranslations('words')
  const ti = useTranslations('interests')
  const [searchValue, setSearchValue] = useState(filters.q)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onFilterChange('q', searchValue)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchValue]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchValue && (
          <button
            onClick={() => setSearchValue('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <Select
          value={filters.interest}
          onValueChange={(v) => onFilterChange('interest', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('allTopics')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allTopics')}</SelectItem>
            {INTEREST_SLUGS.map((slug) => (
              <SelectItem key={slug} value={slug}>
                {INTEREST_EMOJI[slug]} {ti(slug)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.learned}
          onValueChange={(v) => onFilterChange('learned', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('allStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatus')}</SelectItem>
            <SelectItem value="true">{t('learned')}</SelectItem>
            <SelectItem value="false">{t('inProgress')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
