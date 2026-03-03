// ============================================================================
// Wordlary - Word Generation API
// POST: Generate vocabulary words from word bank + Google Gemini fallback
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geminiModel } from '@/lib/gemini/client'
import { buildWordGenerationPrompt } from '@/lib/gemini/prompts'
import { parseGeminiResponse } from '@/lib/gemini/parse'
import type { GeneratedWord } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { session_id } = body

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      )
    }

    // Verify the session belongs to this user and has no words yet
    const { data: session, error: sessionError } = await supabase
      .from('daily_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or does not belong to user' },
        { status: 404 }
      )
    }

    const { data: existingSessionWords } = await supabase
      .from('learned_words')
      .select('id')
      .eq('session_id', session_id)
      .limit(1)

    if (existingSessionWords && existingSessionWords.length > 0) {
      return NextResponse.json(
        { error: 'Words have already been generated for this session' },
        { status: 409 }
      )
    }

    // Get user's interest slugs from user_interests joined with interests
    const { data: userInterests, error: interestsError } = await supabase
      .from('user_interests')
      .select('interest_id, interests(slug)')
      .eq('user_id', user.id)

    if (interestsError || !userInterests || userInterests.length === 0) {
      return NextResponse.json(
        { error: 'User has no interests selected. Complete onboarding first.' },
        { status: 400 }
      )
    }

    const interestSlugs = userInterests
      .map((ui) => {
        const interests = ui.interests as unknown
        if (Array.isArray(interests)) {
          return (interests[0] as { slug: string })?.slug
        }
        return (interests as { slug: string } | null)?.slug
      })
      .filter(Boolean) as string[]

    // Get user's existing word list to exclude duplicates
    const { data: existingWords } = await supabase
      .from('learned_words')
      .select('word')
      .eq('user_id', user.id)

    const existingWordList = (existingWords ?? []).map(
      (w: { word: string }) => w.word.toLowerCase()
    )

    // Get user's preferred difficulty
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('preferred_difficulty')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // ── Step 1: Try to get words from the word bank ──────────────────
    const { data: bankWords } = await supabase.rpc('get_words_from_bank', {
      p_interest_slugs: interestSlugs,
      p_difficulty: profile.preferred_difficulty,
      p_exclude_words: existingWordList,
      p_limit: session.word_count,
    })

    const wordsFromBank: GeneratedWord[] = (bankWords ?? []).map(
      (bw: { word: string; ipa: string; example_sentence: string; word_es: string; sentence_es: string; interest_slug: string }) => ({
        word: bw.word,
        ipa: bw.ipa,
        example_sentence: bw.example_sentence,
        word_es: bw.word_es,
        sentence_es: bw.sentence_es,
        interest_slug: bw.interest_slug,
      })
    )

    const remaining = session.word_count - wordsFromBank.length
    let wordsFromGemini: GeneratedWord[] = []

    // ── Step 2: Fall back to Gemini for remaining words ──────────────
    if (remaining > 0) {
      // Exclude bank words too so Gemini doesn't repeat them
      const allExcluded = [
        ...existingWordList,
        ...wordsFromBank.map((w) => w.word.toLowerCase()),
      ]

      const prompt = buildWordGenerationPrompt(
        interestSlugs,
        allExcluded,
        remaining,
        profile.preferred_difficulty
      )

      const result = await geminiModel.generateContent(prompt)
      const responseText = result.response.text()

      const parsed = parseGeminiResponse(responseText)

      if (!parsed.success) {
        // If bank had some words, use those; otherwise fail
        if (wordsFromBank.length === 0) {
          console.error('Gemini parse error:', parsed.error)
          return NextResponse.json(
            { error: 'Failed to generate valid words. Please try again.' },
            { status: 502 }
          )
        }
        // Proceed with partial bank results
      } else {
        wordsFromGemini = parsed.words

        // ── Step 3: Dual-write Gemini words to word bank ─────────────
        const bankInserts = wordsFromGemini.map((w) => ({
          word: w.word,
          ipa: w.ipa,
          example_sentence: w.example_sentence,
          word_es: w.word_es,
          sentence_es: w.sentence_es,
          interest_slug: w.interest_slug,
          difficulty_level: profile.preferred_difficulty,
        }))

        // Fire-and-forget: use RPC to handle expression index ON CONFLICT
        supabase
          .rpc('word_bank_bulk_insert', { p_words: JSON.stringify(bankInserts) })
          .then(({ error }) => {
            if (error) console.error('Word bank dual-write error:', error)
          })
      }
    }

    // ── Step 4: Insert all words into learned_words ──────────────────
    const allWords = [...wordsFromBank, ...wordsFromGemini]

    const wordsToInsert = allWords.map((word) => ({
      user_id: user.id,
      session_id: session_id,
      word: word.word,
      ipa: word.ipa,
      example_sentence: word.example_sentence,
      word_es: word.word_es,
      sentence_es: word.sentence_es,
      interest_slug: word.interest_slug,
      is_learned: false,
    }))

    const { data: insertedWords, error: insertError } = await supabase
      .from('learned_words')
      .insert(wordsToInsert)
      .select()

    if (insertError || !insertedWords) {
      console.error('Insert words error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save generated words' },
        { status: 500 }
      )
    }

    return NextResponse.json({ words: insertedWords })
  } catch (error) {
    console.error('Generate POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
