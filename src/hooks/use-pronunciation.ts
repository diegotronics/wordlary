'use client'

import { useState, useCallback, useEffect } from 'react'

interface UsePronunciationOptions {
  wordId: string
  word: string
}

interface UsePronunciationReturn {
  playNormal: (e: React.MouseEvent) => void
  playSlow: (e: React.MouseEvent) => void
  isPlayingNormal: boolean
  isPlayingSlow: boolean
}

function speakWithWebSpeech(word: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve()
      return
    }

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
}: UsePronunciationOptions): UsePronunciationReturn {
  const [isPlayingNormal, setIsPlayingNormal] = useState(false)
  const [isPlayingSlow, setIsPlayingSlow] = useState(false)

  // Cleanup on unmount or word change
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [wordId])

  const stopCurrent = useCallback(() => {
    window.speechSynthesis?.cancel()
    setIsPlayingNormal(false)
    setIsPlayingSlow(false)
  }, [])

  const play = useCallback(
    async (rate: number, setPlaying: (v: boolean) => void) => {
      stopCurrent()
      setPlaying(true)
      await speakWithWebSpeech(word, rate)
      setPlaying(false)
    },
    [word, stopCurrent]
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
  }
}
