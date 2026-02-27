'use client'
import { useState, useEffect } from 'react'

interface SessionStatus {
  hasSession: boolean
  isCompleted: boolean
  wordsCompleted: number
  wordCount: number
  hasWords: boolean
}

export function useSessionStatus() {
  const [status, setStatus] = useState<SessionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/session')
      .then((r) => {
        if (!r.ok) throw new Error('session')
        return r.json()
      })
      .then((data) => {
        setStatus({
          hasSession: !!data.session,
          isCompleted: data.session?.is_completed ?? false,
          wordsCompleted: data.session?.words_completed ?? 0,
          wordCount: data.session?.word_count ?? 0,
          hasWords: (data.words?.length ?? 0) > 0,
        })
      })
      .catch(() => {
        /* status stays null */
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { status, isLoading }
}
