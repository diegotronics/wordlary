// ============================================================================
// VocabFlow - Interests API
// GET:  Get all interests and the user's selected ones
// PUT:  Update the user's interest selections
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { interestSelectionSchema } from '@/lib/validators'
import { MIN_INTERESTS, MAX_INTERESTS } from '@/lib/constants'

// ---------------------------------------------------------------------------
// GET - Fetch all interests and the user's selected interest IDs
// ---------------------------------------------------------------------------
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

    // Fetch all available interests
    const { data: allInterests, error: interestsError } = await supabase
      .from('interests')
      .select('*')
      .order('name', { ascending: true })

    if (interestsError) {
      return NextResponse.json(
        { error: 'Failed to fetch interests' },
        { status: 500 }
      )
    }

    // Fetch user's selected interest IDs
    const { data: userInterests, error: userInterestsError } = await supabase
      .from('user_interests')
      .select('interest_id')
      .eq('user_id', user.id)

    if (userInterestsError) {
      return NextResponse.json(
        { error: 'Failed to fetch user interests' },
        { status: 500 }
      )
    }

    const selected = (userInterests ?? []).map(
      (ui: { interest_id: string }) => ui.interest_id
    )

    return NextResponse.json({
      all: allInterests ?? [],
      selected,
    })
  } catch (error) {
    console.error('Interests GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// PUT - Update user's interest selections
// ---------------------------------------------------------------------------
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { interest_ids, complete_onboarding, daily_word_count, preferred_difficulty } = body as {
      interest_ids: string[]
      complete_onboarding?: boolean
      daily_word_count?: number
      preferred_difficulty?: 'beginner' | 'intermediate' | 'advanced'
    }

    // Validate interest_ids
    const validation = interestSelectionSchema.safeParse(interest_ids)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: `Select between ${MIN_INTERESTS} and ${MAX_INTERESTS} interests`,
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    // Delete existing user_interests
    const { error: deleteError } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to clear existing interests' },
        { status: 500 }
      )
    }

    // Insert new user_interests
    const rows = validation.data.map((interestId: string) => ({
      user_id: user.id,
      interest_id: interestId,
    }))

    const { error: insertError } = await supabase
      .from('user_interests')
      .insert(rows)

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to save interests' },
        { status: 500 }
      )
    }

    // If completing onboarding, update the profile flag and preferences
    if (complete_onboarding) {
      const profileUpdate: Record<string, unknown> = { onboarding_completed: true }

      if (daily_word_count && daily_word_count >= 5 && daily_word_count <= 20) {
        profileUpdate.daily_word_count = daily_word_count
      }
      if (preferred_difficulty && ['beginner', 'intermediate', 'advanced'].includes(preferred_difficulty)) {
        profileUpdate.preferred_difficulty = preferred_difficulty
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id)

      if (profileError) {
        console.error('Failed to update onboarding status:', profileError)
        return NextResponse.json(
          { error: 'Failed to complete onboarding' },
          { status: 500 }
        )
      }
    }

    // Return the updated selection
    return NextResponse.json({
      selected: validation.data,
    })
  } catch (error) {
    console.error('Interests PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
