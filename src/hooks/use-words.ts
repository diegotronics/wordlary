'use client'
import useSWR from 'swr'

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

function buildKey(filters: WordsFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.interest) params.set('interest', filters.interest)
  if (filters.learned) params.set('learned', filters.learned)
  params.set('sort', filters.sort)
  params.set('order', filters.order)
  params.set('page', String(filters.page))
  return `/api/words/all?${params}`
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('words')
  return res.json()
}

export function useWords(filters: WordsFilters) {
  const { data, isLoading } = useSWR(buildKey(filters), fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })

  const words: WordItem[] = data?.words ?? []
  const pagination: WordsPagination = {
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    perPage: data?.per_page ?? 20,
    totalPages: data?.total_pages ?? 0,
  }

  return { words, pagination, isLoading }
}
