// ============================================================================
// VocabFlow - Dev Testing API (SOLO para desarrollo)
// POST: Manipular datos para testing rápido
//
// Este endpoint SOLO funciona cuando NODE_ENV !== 'production'.
// Permite simular escenarios sin acceder directamente a la base de datos.
//
// Acciones disponibles:
//   - force-reviews:      Mover next_review_date a hoy para tener repasos
//   - reset-session:      Borrar sesión de hoy (se regenera al recargar)
//   - set-streak:         Cambiar el streak del usuario
//   - reset-progress:     Borrar todo el progreso (mantiene cuenta e intereses)
//   - inspect:            Ver estado actual del usuario
//   - seed-words:         Insertar palabras de prueba en la sesión actual
//   - complete-session:   Marcar todas las palabras como aprendidas
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Dev endpoint disabled in production' },
      { status: 403 }
    )
  }

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
    const { action, ...params } = body

    switch (action) {
      // ── Forzar repasos para hoy ────────────────────────────────────
      case 'force-reviews': {
        const limit = params.limit ?? 999
        const today = new Date().toISOString().split('T')[0]

        const { data, error } = await supabase
          .from('review_schedule')
          .update({ next_review_date: today })
          .eq('user_id', user.id)
          .gt('next_review_date', today)
          .limit(limit)
          .select('id')

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
          message: `${data?.length ?? 0} reviews moved to today`,
          updated: data?.length ?? 0,
        })
      }

      // ── Resetear sesión de hoy ─────────────────────────────────────
      case 'reset-session': {
        const today = new Date().toISOString().split('T')[0]

        // Get today's session
        const { data: session } = await supabase
          .from('daily_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('session_date', today)
          .maybeSingle()

        if (!session) {
          return NextResponse.json({ message: 'No session today to reset' })
        }

        // Delete associated review schedules first
        const { data: words } = await supabase
          .from('learned_words')
          .select('id')
          .eq('session_id', session.id)

        if (words && words.length > 0) {
          const wordIds = words.map((w) => w.id)
          await supabase
            .from('review_schedule')
            .delete()
            .in('word_id', wordIds)
        }

        // Delete words, then session
        await supabase
          .from('learned_words')
          .delete()
          .eq('session_id', session.id)

        await supabase
          .from('daily_sessions')
          .delete()
          .eq('id', session.id)

        return NextResponse.json({
          message: 'Today\'s session deleted. Reload the app to create a new one.',
          deleted_words: words?.length ?? 0,
        })
      }

      // ── Cambiar streak ─────────────────────────────────────────────
      case 'set-streak': {
        const { current = 0, longest, last_date } = params

        const updateData: Record<string, unknown> = {
          current_streak: current,
          longest_streak: longest ?? current,
        }

        if (last_date !== undefined) {
          updateData.last_session_date = last_date
        } else if (current > 0) {
          // If setting a streak > 0, set last_session_date to today
          updateData.last_session_date = new Date().toISOString().split('T')[0]
        }

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
          message: `Streak updated to ${current}`,
          ...updateData,
        })
      }

      // ── Reset completo ─────────────────────────────────────────────
      case 'reset-progress': {
        // Delete in order: review_schedule → learned_words → daily_sessions
        await supabase
          .from('review_schedule')
          .delete()
          .eq('user_id', user.id)

        await supabase
          .from('learned_words')
          .delete()
          .eq('user_id', user.id)

        await supabase
          .from('daily_sessions')
          .delete()
          .eq('user_id', user.id)

        await supabase
          .from('profiles')
          .update({
            current_streak: 0,
            longest_streak: 0,
            last_session_date: null,
          })
          .eq('id', user.id)

        return NextResponse.json({
          message: 'All progress reset. Onboarding and interests preserved.',
        })
      }

      // ── Inspeccionar estado ────────────────────────────────────────
      case 'inspect': {
        const today = new Date().toISOString().split('T')[0]

        const [profile, session, reviews, totalWords] = await Promise.all([
          supabase
            .from('profiles')
            .select('current_streak, longest_streak, last_session_date, daily_word_count, preferred_difficulty')
            .eq('id', user.id)
            .single(),
          supabase
            .from('daily_sessions')
            .select('id, session_date, word_count, words_completed, is_completed')
            .eq('user_id', user.id)
            .eq('session_date', today)
            .maybeSingle(),
          supabase
            .from('review_schedule')
            .select('id, next_review_date, repetition_number, ease_factor')
            .eq('user_id', user.id)
            .lte('next_review_date', today),
          supabase
            .from('learned_words')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_learned', true),
        ])

        // Count future reviews
        const { count: futureReviewCount } = await supabase
          .from('review_schedule')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gt('next_review_date', today)

        return NextResponse.json({
          user_id: user.id,
          profile: profile.data,
          today_session: session.data,
          reviews_due_today: reviews.data?.length ?? 0,
          reviews_scheduled_future: futureReviewCount ?? 0,
          total_words_learned: totalWords.count ?? 0,
        })
      }

      // ── Insertar palabras de prueba ─────────────────────────────────
      case 'seed-words': {
        const today = new Date().toISOString().split('T')[0]

        // Get or create today's session
        let { data: session } = await supabase
          .from('daily_sessions')
          .select('id, word_count')
          .eq('user_id', user.id)
          .eq('session_date', today)
          .maybeSingle()

        if (!session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('daily_word_count')
            .eq('id', user.id)
            .single()

          const { data: newSession } = await supabase
            .from('daily_sessions')
            .insert({
              user_id: user.id,
              session_date: today,
              word_count: profile?.daily_word_count ?? 10,
              words_completed: 0,
              is_completed: false,
            })
            .select()
            .single()

          session = newSession
        }

        if (!session) {
          return NextResponse.json({ error: 'Failed to get/create session' }, { status: 500 })
        }

        const testWords = [
          { word: 'algorithm', ipa: '/ˈælɡərɪðəm/', example_sentence: 'The sorting algorithm runs in O(n log n).', word_es: 'algoritmo', sentence_es: 'El algoritmo de ordenamiento corre en O(n log n).', interest_slug: 'technology' },
          { word: 'benchmark', ipa: '/ˈbentʃmɑːrk/', example_sentence: 'We need to benchmark our API performance.', word_es: 'punto de referencia', sentence_es: 'Necesitamos hacer benchmarks del rendimiento de nuestra API.', interest_slug: 'technology' },
          { word: 'catalyst', ipa: '/ˈkætəlɪst/', example_sentence: 'The new policy was a catalyst for change.', word_es: 'catalizador', sentence_es: 'La nueva política fue un catalizador del cambio.', interest_slug: 'science' },
          { word: 'diligent', ipa: '/ˈdɪlɪdʒənt/', example_sentence: 'She is a diligent student who always does her homework.', word_es: 'diligente', sentence_es: 'Ella es una estudiante diligente que siempre hace su tarea.', interest_slug: 'education' },
          { word: 'eloquent', ipa: '/ˈeləkwənt/', example_sentence: 'The speaker gave an eloquent speech.', word_es: 'elocuente', sentence_es: 'El orador dio un discurso elocuente.', interest_slug: 'culture' },
        ]

        const wordsToInsert = testWords.map((w) => ({
          ...w,
          user_id: user.id,
          session_id: session.id,
          is_learned: false,
        }))

        const { data: inserted, error } = await supabase
          .from('learned_words')
          .insert(wordsToInsert)
          .select()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
          message: `${inserted?.length ?? 0} test words added to today's session`,
          words: inserted,
        })
      }

      // ── Completar sesión de hoy ────────────────────────────────────
      case 'complete-session': {
        const today = new Date().toISOString().split('T')[0]

        const { data: session } = await supabase
          .from('daily_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('session_date', today)
          .maybeSingle()

        if (!session) {
          return NextResponse.json({ message: 'No session today' })
        }

        // Get unlearned words
        const { data: words } = await supabase
          .from('learned_words')
          .select('id')
          .eq('session_id', session.id)
          .eq('is_learned', false)

        if (!words || words.length === 0) {
          return NextResponse.json({ message: 'All words already learned' })
        }

        // Mark all as learned
        const wordIds = words.map((w) => w.id)
        await supabase
          .from('learned_words')
          .update({ is_learned: true })
          .in('id', wordIds)

        // Create review schedules
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const nextReviewDate = tomorrow.toISOString().split('T')[0]

        const schedules = wordIds.map((wId) => ({
          user_id: user.id,
          word_id: wId,
          next_review_date: nextReviewDate,
          ease_factor: 2.5,
          repetition_number: 0,
          interval_days: 1,
          total_reviews: 0,
          correct_reviews: 0,
        }))

        await supabase
          .from('review_schedule')
          .upsert(schedules, { onConflict: 'word_id' })

        // Update session
        const { data: sessionWords } = await supabase
          .from('learned_words')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', session.id)

        await supabase
          .from('daily_sessions')
          .update({
            words_completed: sessionWords?.count ?? words.length,
            is_completed: true,
          })
          .eq('id', session.id)

        return NextResponse.json({
          message: `${words.length} words marked as learned, session completed`,
          words_completed: words.length,
        })
      }

      default:
        return NextResponse.json(
          {
            error: `Unknown action: ${action}`,
            available_actions: [
              'force-reviews',
              'reset-session',
              'set-streak',
              'reset-progress',
              'inspect',
              'seed-words',
              'complete-session',
            ],
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Dev API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
