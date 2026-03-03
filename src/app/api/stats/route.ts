// ============================================================================
// Wordlary - Statistics API
// GET: Get comprehensive user learning statistics
// ============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserToday } from '@/lib/date'

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

    // Fetch profile first to get timezone for date calculation
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, timezone')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch profile data' },
        { status: 500 }
      )
    }

    const today = getUserToday(profile?.timezone)

    // Run remaining queries in parallel for performance
    const [
      totalWordsResult,
      reviewsDueResult,
      wordsByInterestResult,
      sessionsCompletedResult,
      reviewAccuracyResult,
    ] = await Promise.all([
      // Total words learned
      supabase
        .from('learned_words')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_learned', true),

      // Words due for review today
      supabase
        .from('review_schedule')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lte('next_review_date', today),

      // Words grouped by interest
      supabase
        .from('learned_words')
        .select('interest_slug')
        .eq('user_id', user.id)
        .eq('is_learned', true),

      // Total sessions completed
      supabase
        .from('daily_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_completed', true),

      // Review accuracy data
      supabase
        .from('review_schedule')
        .select('total_reviews, correct_reviews')
        .eq('user_id', user.id),
    ])

    // Calculate words by interest
    const interestCounts: Record<string, number> = {}
    if (wordsByInterestResult.data) {
      for (const row of wordsByInterestResult.data) {
        const slug = row.interest_slug
        interestCounts[slug] = (interestCounts[slug] ?? 0) + 1
      }
    }

    // Calculate average review accuracy
    let totalReviews = 0
    let correctReviews = 0
    if (reviewAccuracyResult.data) {
      for (const schedule of reviewAccuracyResult.data) {
        totalReviews += schedule.total_reviews
        correctReviews += schedule.correct_reviews
      }
    }
    const averageAccuracy =
      totalReviews > 0
        ? Math.round((correctReviews / totalReviews) * 100) / 100
        : null

    return NextResponse.json({
      total_words_learned: totalWordsResult.count ?? 0,
      current_streak: profile?.current_streak ?? 0,
      longest_streak: profile?.longest_streak ?? 0,
      words_due_for_review: reviewsDueResult.count ?? 0,
      words_by_interest: interestCounts,
      total_sessions_completed: sessionsCompletedResult.count ?? 0,
      average_review_accuracy: averageAccuracy,
    })
  } catch (error) {
    console.error('Stats GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
