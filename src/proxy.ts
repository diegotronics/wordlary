import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const publicPaths = ['/login', '/register', '/api/auth/callback', '/offline']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    if (user && (pathname === '/login' || pathname === '/register')) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Redirect unauthenticated users to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Check onboarding status (skip API routes)
  if (!pathname.startsWith('/api/')) {
    const onboardingDone = request.cookies.get('onboarding_done')?.value === '1'

    if (onboardingDone) {
      // User already completed onboarding — skip DB query
      if (pathname === '/onboarding') {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    } else {
      // No cookie — check DB
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, preferred_language')
        .eq('id', user.id)
        .single()

      if (!profile || !profile.onboarding_completed) {
        if (pathname !== '/onboarding') {
          const url = request.nextUrl.clone()
          url.pathname = '/onboarding'
          return NextResponse.redirect(url)
        }
        return supabaseResponse
      }

      // Onboarding is completed — set cookie to skip DB query on future navigations
      supabaseResponse.cookies.set('onboarding_done', '1', {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
        httpOnly: true,
      })

      if (pathname === '/onboarding') {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }

      // Sync locale cookie from profile if not already set
      const localeCookie = request.cookies.get('NEXT_LOCALE')
      if (!localeCookie && profile.preferred_language) {
        supabaseResponse.cookies.set('NEXT_LOCALE', profile.preferred_language, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          sameSite: 'lax',
        })
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
