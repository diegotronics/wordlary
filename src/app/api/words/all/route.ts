// ============================================================================
// Wordlary - All Words API
// GET: Paginated list of all learned words with search, filter, and sort
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SORT_WHITELIST = ['word', 'word_es', 'created_at', 'interest_slug']
const DEFAULT_PER_PAGE = 20
const MIN_PER_PAGE = 10
const MAX_PER_PAGE = 50

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
    const q = searchParams.get('q')?.trim() ?? ''
    const interest = searchParams.get('interest') ?? ''
    const learned = searchParams.get('learned') ?? ''
    const sortParam = searchParams.get('sort') ?? 'created_at'
    const orderParam = searchParams.get('order') ?? 'desc'
    const pageParam = parseInt(searchParams.get('page') ?? '1', 10)
    const perPageParam = parseInt(searchParams.get('per_page') ?? String(DEFAULT_PER_PAGE), 10)

    const sortColumn = SORT_WHITELIST.includes(sortParam) ? sortParam : 'created_at'
    const ascending = orderParam === 'asc'
    const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam)
    const perPage = Math.min(MAX_PER_PAGE, Math.max(MIN_PER_PAGE, isNaN(perPageParam) ? DEFAULT_PER_PAGE : perPageParam))

    let query = supabase
      .from('learned_words')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // Search by word or translation
    if (q) {
      const sanitized = q.replace(/[%_]/g, '')
      if (sanitized) {
        query = query.or(`word.ilike.%${sanitized}%,word_es.ilike.%${sanitized}%`)
      }
    }

    // Filter by interest
    if (interest) {
      query = query.eq('interest_slug', interest)
    }

    // Filter by learned status
    if (learned === 'true') {
      query = query.eq('is_learned', true)
    } else if (learned === 'false') {
      query = query.eq('is_learned', false)
    }

    // Sort
    query = query.order(sortColumn, { ascending })

    // Pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1
    query = query.range(from, to)

    const { data: words, error: wordsError, count } = await query

    if (wordsError) {
      return NextResponse.json(
        { error: 'Failed to fetch words' },
        { status: 500 }
      )
    }

    const total = count ?? 0
    const totalPages = Math.ceil(total / perPage)

    return NextResponse.json({
      words: words ?? [],
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
    })
  } catch (error) {
    console.error('Words all GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
