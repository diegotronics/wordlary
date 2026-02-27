import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { locales, LOCALE_COOKIE, type Locale } from '@/i18n/config'

export async function POST(request: NextRequest) {
  const { locale } = await request.json()

  if (!locales.includes(locale as Locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase
      .from('profiles')
      .update({ preferred_language: locale })
      .eq('id', user.id)
  }

  const response = NextResponse.json({ locale })
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  return response
}
