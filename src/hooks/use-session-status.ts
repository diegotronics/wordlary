'use client'
import useSWR from 'swr'

interface SessionStatus {
  hasSession: boolean
  isCompleted: boolean
  wordsCompleted: number
  wordCount: number
  hasWords: boolean
}

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error('session')
      return r.json()
    })
    .then((data) => ({
      hasSession: !!data.session,
      isCompleted: data.session?.is_completed ?? false,
      wordsCompleted: data.session?.words_completed ?? 0,
      wordCount: data.session?.word_count ?? 0,
      hasWords: (data.words?.length ?? 0) > 0,
    } satisfies SessionStatus))

export function useSessionStatus() {
  const { data: status, isLoading } = useSWR<SessionStatus>(
    '/api/session',
    fetcher,
    {
      dedupingInterval: 10000,
    }
  )

  return { status: status ?? null, isLoading }
}
