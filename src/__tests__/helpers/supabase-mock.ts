/**
 * Reusable Supabase mock factory for API route tests.
 *
 * Produces a chainable mock that mirrors the Supabase client API used
 * throughout the codebase: `supabase.from('table').select().eq().single()`
 */

export interface MockSupabaseOptions {
  user?: { id: string; email?: string } | null
  authError?: Error | null
}

/**
 * Creates a chainable query builder mock.
 * Every chainable method returns the builder itself.
 * Terminal methods (single, maybeSingle) resolve with configured data.
 */
export function createQueryBuilder(
  resolvedData: unknown = null,
  resolvedError: unknown = null,
) {
  const terminal = { data: resolvedData, error: resolvedError }

  const builder: Record<string, ReturnType<typeof vi.fn>> = {}

  const chainMethods = [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'or', 'in',
    'order', 'limit', 'range',
  ]

  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(builder)
  }

  // Terminal methods that resolve the query
  builder.single = vi.fn().mockResolvedValue(terminal)
  builder.maybeSingle = vi.fn().mockResolvedValue(terminal)

  // Allow then() so the builder can be awaited directly (for insert/update without single)
  builder.then = vi.fn((resolve: (v: unknown) => void) => resolve(terminal))

  return builder
}

export function createMockSupabase(options: MockSupabaseOptions = {}) {
  const { user = { id: 'test-user-id' }, authError = null } = options

  const fromMocks = new Map<string, ReturnType<typeof createQueryBuilder>>()

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: authError,
      }),
    },
    from: vi.fn((table: string) => {
      if (!fromMocks.has(table)) {
        fromMocks.set(table, createQueryBuilder())
      }
      return fromMocks.get(table)!
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }

  return { supabase, fromMocks, createQueryBuilder }
}
