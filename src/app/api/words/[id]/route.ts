// ============================================================================
// VocabFlow - Single Word API
// PATCH: Mark a word as learned / not learned
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: wordId } = await params
    const body = await request.json()
    const { is_learned } = body

    if (typeof is_learned !== 'boolean') {
      return NextResponse.json(
        { error: 'is_learned (boolean) is required' },
        { status: 400 }
      )
    }

    // Fetch the word to verify ownership and get session_id
    const { data: word, error: wordError } = await supabase
      .from('learned_words')
      .select('*, daily_sessions(word_count, words_completed)')
      .eq('id', wordId)
      .eq('user_id', user.id)
      .single()

    if (wordError || !word) {
      return NextResponse.json(
        { error: 'Word not found' },
        { status: 404 }
      )
    }

    // Determine the words_completed delta
    const wasLearned = word.is_learned
    let completedDelta = 0
    if (is_learned && !wasLearned) {
      completedDelta = 1
    } else if (!is_learned && wasLearned) {
      completedDelta = -1
    }

    // Update the word
    const { data: updatedWord, error: updateError } = await supabase
      .from('learned_words')
      .update({ is_learned })
      .eq('id', wordId)
      .select()
      .single()

    if (updateError || !updatedWord) {
      return NextResponse.json(
        { error: 'Failed to update word' },
        { status: 500 }
      )
    }

    // Run session update, review schedule, and streak update in parallel
    const sideEffects: Promise<void>[] = []

    // Update session words_completed count
    if (completedDelta !== 0) {
      const session = word.daily_sessions as {
        word_count: number
        words_completed: number
      }
      const newCompleted = session.words_completed + completedDelta
      const isCompleted = newCompleted >= session.word_count

      sideEffects.push(
        supabase
          .from('daily_sessions')
          .update({
            words_completed: newCompleted,
            is_completed: isCompleted,
          })
          .eq('id', word.session_id)
          .then(({ error }) => {
            if (error) console.error('Failed to update session:', error)
          })
      )
    }

    // If marking as learned, create a review schedule entry
    if (is_learned && !wasLearned) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextReviewDate = tomorrow.toISOString().split('T')[0]

      sideEffects.push(
        supabase
          .from('review_schedule')
          .upsert(
            {
              user_id: user.id,
              word_id: wordId,
              next_review_date: nextReviewDate,
              ease_factor: 2.5,
              repetition_number: 0,
              interval_days: 1,
              total_reviews: 0,
              correct_reviews: 0,
            },
            { onConflict: 'word_id' }
          )
          .then(({ error }) => {
            if (error) console.error('Failed to create review schedule:', error)
          })
      )

      // Update user streak
      sideEffects.push(
        (async () => {
          const today = new Date().toISOString().split('T')[0]

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('current_streak, longest_streak, last_session_date')
            .eq('id', user.id)
            .single()

          if (profileError || !profile) return

          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split('T')[0]

          let newStreak = profile.current_streak
          const lastDate = profile.last_session_date

          if (lastDate === today) {
            // Already updated today, no streak change needed
          } else if (lastDate === yesterdayStr) {
            newStreak = profile.current_streak + 1
          } else {
            newStreak = 1
          }

          const newLongest = Math.max(newStreak, profile.longest_streak)

          const { error: streakError } = await supabase
            .from('profiles')
            .update({
              current_streak: newStreak,
              longest_streak: newLongest,
              last_session_date: today,
            })
            .eq('id', user.id)

          if (streakError) console.error('Failed to update streak:', streakError)
        })()
      )
    }

    await Promise.all(sideEffects)

    return NextResponse.json({ word: updatedWord })
  } catch (error) {
    console.error('Words PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
