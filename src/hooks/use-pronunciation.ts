'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UsePronunciationOptions {
  wordId: string
  word: string
  audioUrl?: string | null
}

interface UsePronunciationReturn {
  playNormal: (e: React.MouseEvent) => void
  playSlow: (e: React.MouseEvent) => void
  isPlayingNormal: boolean
  isPlayingSlow: boolean
  isLoading: boolean
}

function speakWithWebSpeech(word: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve()
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.rate = rate
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    window.speechSynthesis.speak(utterance)
  })
}

export function usePronunciation({
  wordId,
  word,
  audioUrl,
}: UsePronunciationOptions): UsePronunciationReturn {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(
    audioUrl ?? null
  )
  const [isPlayingNormal, setIsPlayingNormal] = useState(false)
  const [isPlayingSlow, setIsPlayingSlow] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasResolved, setHasResolved] = useState(!!audioUrl)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Sync if audioUrl prop changes (e.g. new word)
  useEffect(() => {
    setResolvedUrl(audioUrl ?? null)
    setHasResolved(!!audioUrl)
  }, [audioUrl])

  // Cleanup on unmount or word change
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
      window.speechSynthesis?.cancel()
    }
  }, [wordId])

  const resolveAudioUrl = useCallback(async (): Promise<string | null> => {
    if (hasResolved) return resolvedUrl

    setIsLoading(true)
    try {
      const response = await fetch('/api/pronunciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word_id: wordId, word }),
      })

      if (response.ok) {
        const data = await response.json()
        const url = data.audio_url ?? null
        setResolvedUrl(url)
        setHasResolved(true)
        return url
      }
    } catch {
      // API failed — will fall back to Web Speech
    } finally {
      setIsLoading(false)
    }

    setHasResolved(true)
    return null
  }, [wordId, word, hasResolved, resolvedUrl])

  const stopCurrent = useCallback(() => {
    audioRef.current?.pause()
    audioRef.current = null
    window.speechSynthesis?.cancel()
    setIsPlayingNormal(false)
    setIsPlayingSlow(false)
  }, [])

  const play = useCallback(
    async (rate: number, setPlaying: (v: boolean) => void) => {
      stopCurrent()

      const url = await resolveAudioUrl()

      setPlaying(true)

      if (url) {
        try {
          const audio = new Audio(url)
          audio.playbackRate = rate
          audioRef.current = audio

          await new Promise<void>((resolve, reject) => {
            audio.onended = () => resolve()
            audio.onerror = () => reject(new Error('Audio playback failed'))
            audio.play().catch(reject)
          })

          setPlaying(false)
          return
        } catch {
          // Audio failed — fall back to Web Speech
          audioRef.current = null
        }
      }

      // Web Speech fallback
      await speakWithWebSpeech(word, rate)
      setPlaying(false)
    },
    [word, resolveAudioUrl, stopCurrent]
  )

  const playNormal = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      play(1.0, setIsPlayingNormal)
    },
    [play]
  )

  const playSlow = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      play(0.65, setIsPlayingSlow)
    },
    [play]
  )

  return {
    playNormal,
    playSlow,
    isPlayingNormal,
    isPlayingSlow,
    isLoading,
  }
}
