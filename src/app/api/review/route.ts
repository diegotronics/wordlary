// ============================================================================
// VocabFlow - Review API
// GET: Get words due for review today
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

    const today = new Date().toISOString().split('T')[0]

    // Fetch review schedules due today or earlier, joined with learned_words
    const { data: reviews, error: reviewError } = await supabase
      .from('review_schedule')
      .select('*, learned_words(*)')
      .eq('user_id', user.id)
      .lte('next_review_date', today)
      .order('next_review_date', { ascending: true })

    if (reviewError) {
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reviews: reviews ?? [] })
  } catch (error) {
    console.error('Review GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
