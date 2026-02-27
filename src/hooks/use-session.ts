'use client'
import { useEffect } from 'react'
import { useSessionStore } from '@/stores/session-store'

export function useSession() {
  const store = useSessionStore()

  useEffect(() => {
    store.fetchSession()
    return () => {
      useSessionStore.setState({ isPracticing: false })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return store
}
