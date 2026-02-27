// ============================================================================
// VocabFlow - Daily Session API
// GET: Get or create today's learning session
// ============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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

    // Check for an existing session today
    const today = new Date().toISOString().split('T')[0]

    const { data: existingSession, error: sessionError } = await supabase
      .from('daily_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_date', today)
      .maybeSingle()

    if (sessionError) {
      return NextResponse.json(
        { error: 'Failed to fetch session' },
        { status: 500 }
      )
    }

    // Session exists -- return it with its words
    if (existingSession) {
      const { data: words, error: wordsError } = await supabase
        .from('learned_words')
        .select('*')
        .eq('session_id', existingSession.id)
        .order('created_at', { ascending: true })

      if (wordsError) {
        return NextResponse.json(
          { error: 'Failed to fetch session words' },
          { status: 500 }
        )
      }

      return NextResponse.json({ session: existingSession, words })
    }

    // No session today -- get user's daily_word_count from their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('daily_word_count')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Create a new session for today
    const { data: newSession, error: insertError } = await supabase
      .from('daily_sessions')
      .insert({
        user_id: user.id,
        session_date: today,
        word_count: profile.daily_word_count,
        words_completed: 0,
        is_completed: false,
      })
      .select()
      .single()

    if (insertError || !newSession) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      session: newSession,
      words: [],
      needs_generation: true,
    })
  } catch (error) {
    console.error('Session GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
