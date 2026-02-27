import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {
    app: 'ok',
    database: 'error',
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('interests').select('id').limit(1)
    checks.database = error ? 'error' : 'ok'
  } catch {
    checks.database = 'error'
  }

  const healthy = Object.values(checks).every((v) => v === 'ok')

  return NextResponse.json(
    { status: healthy ? 'healthy' : 'degraded', checks },
    { status: healthy ? 200 : 503 }
  )
}
