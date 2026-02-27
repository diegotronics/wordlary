// ============================================================================
// VocabFlow - Word Generation API
// POST: Generate vocabulary words via Google Gemini
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geminiModel } from '@/lib/gemini/client'
import { buildWordGenerationPrompt } from '@/lib/gemini/prompts'
import { parseGeminiResponse } from '@/lib/gemini/parse'

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

    // Build the prompt and call Gemini
    const prompt = buildWordGenerationPrompt(
      interestSlugs,
      existingWordList,
      session.word_count,
      profile.preferred_difficulty
    )

    const result = await geminiModel.generateContent(prompt)
    const responseText = result.response.text()

    // Parse and validate the Gemini response
    const parsed = parseGeminiResponse(responseText)

    if (!parsed.success) {
      console.error('Gemini parse error:', parsed.error)
      return NextResponse.json(
        { error: 'Failed to generate valid words. Please try again.' },
        { status: 502 }
      )
    }

    // Insert validated words into learned_words
    const wordsToInsert = parsed.words.map((word) => ({
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
