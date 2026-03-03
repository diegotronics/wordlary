// ============================================================================
// Wordlary - Pronunciation Audio URL Resolver
// POST: Resolve and cache audio URL from Free Dictionary API
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface PhoneticEntry {
  text?: string
  audio?: string
}

interface DictionaryEntry {
  phonetics?: PhoneticEntry[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { word_id, word } = body

    if (!word_id || !word) {
      return NextResponse.json(
        { error: 'word_id and word are required' },
        { status: 400 }
      )
    }

    // Check if audio_url is already cached
    const { data: existing } = await supabase
      .from('learned_words')
      .select('audio_url')
      .eq('id', word_id)
      .eq('user_id', user.id)
      .single()

    if (existing?.audio_url) {
      return NextResponse.json({ audio_url: existing.audio_url })
    }

    // Fetch from Free Dictionary API
    let audioUrl: string | null = null

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
        { signal: AbortSignal.timeout(5000) }
      )

      if (response.ok) {
        const entries: DictionaryEntry[] = await response.json()
        const phonetics = entries?.[0]?.phonetics ?? []

        // Prefer US pronunciation
        const usEntry = phonetics.find(
          (p) => p.audio && p.audio.length > 0 && p.audio.includes('us')
        )
        const anyEntry = phonetics.find(
          (p) => p.audio && p.audio.length > 0
        )

        audioUrl = usEntry?.audio ?? anyEntry?.audio ?? null
      }
    } catch {
      // Dictionary API unavailable — client will use Web Speech fallback
    }

    // Cache the URL if found
    if (audioUrl) {
      await supabase
        .from('learned_words')
        .update({ audio_url: audioUrl })
        .eq('id', word_id)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ audio_url: audioUrl })
  } catch (error) {
    console.error('Pronunciation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
