// ============================================================================
// VocabFlow - Words List API
// GET: List words for a session (defaults to today's session)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    let sessionId = searchParams.get('session_id')

    // If no session_id provided, default to today's session
    if (!sessionId) {
      const today = new Date().toISOString().split('T')[0]

      const { data: todaySession, error: sessionError } = await supabase
        .from('daily_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('session_date', today)
        .maybeSingle()

      if (sessionError) {
        return NextResponse.json(
          { error: 'Failed to fetch today\'s session' },
          { status: 500 }
        )
      }

      if (!todaySession) {
        return NextResponse.json(
          { error: 'No session found for today' },
          { status: 404 }
        )
      }

      sessionId = todaySession.id
    }

    // Fetch words for the session
    const { data: words, error: wordsError } = await supabase
      .from('learned_words')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (wordsError) {
      return NextResponse.json(
        { error: 'Failed to fetch words' },
        { status: 500 }
      )
    }

    return NextResponse.json({ words: words ?? [] })
  } catch (error) {
    console.error('Words GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
