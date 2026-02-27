'use client'

import { useState, useEffect, useCallback } from 'react'

export interface WordItem {
  id: string
  word: string
  ipa: string | null
  example_sentence: string | null
  word_es: string | null
  sentence_es: string | null
  interest_slug: string | null
  is_learned: boolean
  created_at: string
}

export interface WordsPagination {
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface WordsFilters {
  q: string
  interest: string
  learned: string
  sort: string
  order: 'asc' | 'desc'
  page: number
}

export function useWords(filters: WordsFilters) {
  const [words, setWords] = useState<WordItem[]>([])
  const [pagination, setPagination] = useState<WordsPagination>({
    total: 0,
    page: 1,
    perPage: 20,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchWords = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.q) params.set('q', filters.q)
      if (filters.interest) params.set('interest', filters.interest)
      if (filters.learned) params.set('learned', filters.learned)
      params.set('sort', filters.sort)
      params.set('order', filters.order)
      params.set('page', String(filters.page))

      const res = await fetch(`/api/words/all?${params}`)
      if (!res.ok) return

      const data = await res.json()
      setWords(data.words ?? [])
      setPagination({
        total: data.total,
        page: data.page,
        perPage: data.per_page,
        totalPages: data.total_pages,
      })
    } catch {
      // keep current state on error
    } finally {
      setIsLoading(false)
    }
  }, [filters.q, filters.interest, filters.learned, filters.sort, filters.order, filters.page])

  useEffect(() => {
    fetchWords()
  }, [fetchWords])

  return { words, pagination, isLoading }
}
