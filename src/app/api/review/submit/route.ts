// ============================================================================
// VocabFlow - Review Submission API
// POST: Submit a review result and apply the SM-2 algorithm
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reviewSubmissionSchema } from '@/lib/validators'
import { calculateSM2 } from '@/lib/spaced-repetition/sm2'
import type { ReviewQuality } from '@/lib/types'

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single()

    // Parse and validate request body
    const body = await request.json()
    const validation = reviewSubmissionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { word_id, quality } = validation.data

    // Fetch current review_schedule for the word
    const { data: schedule, error: scheduleError } = await supabase
      .from('review_schedule')
      .select('*')
      .eq('word_id', word_id)
      .eq('user_id', user.id)
      .single()

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { error: 'Review schedule not found for this word' },
        { status: 404 }
      )
    }

    // Apply SM-2 algorithm
    const sm2Result = calculateSM2({
      quality: quality as ReviewQuality,
      repetitionNumber: schedule.repetition_number,
      easeFactor: schedule.ease_factor,
      intervalDays: schedule.interval_days,
      timezone: profile?.timezone,
    })

    // Update review counters
    const newTotalReviews = schedule.total_reviews + 1
    const newCorrectReviews =
      quality >= 3
        ? schedule.correct_reviews + 1
        : schedule.correct_reviews

    // Update the review_schedule record
    const { data: updatedSchedule, error: updateError } = await supabase
      .from('review_schedule')
      .update({
        repetition_number: sm2Result.repetitionNumber,
        ease_factor: sm2Result.easeFactor,
        interval_days: sm2Result.intervalDays,
        next_review_date: sm2Result.nextReviewDate,
        last_reviewed_at: new Date().toISOString(),
        total_reviews: newTotalReviews,
        correct_reviews: newCorrectReviews,
      })
      .eq('id', schedule.id)
      .select()
      .single()

    if (updateError || !updatedSchedule) {
      return NextResponse.json(
        { error: 'Failed to update review schedule' },
        { status: 500 }
      )
    }

    return NextResponse.json({ schedule: updatedSchedule })
  } catch (error) {
    console.error('Review submit POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
