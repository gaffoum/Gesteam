import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. Initialiser le client Supabase pour le middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 2. Vérifier la session
  const { data: { session } } = await supabase.auth.getSession()
  const url = request.nextUrl.pathname

  // 3. Logique de protection des routes
  if (!session && url !== '/login' && url !== '/register' && !url.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, club_id')
      .eq('id', session.user.id)
      .single()

    // Redirection SuperAdmin (Interdire le dashboard club)
    if (profile?.role === 'superAdmin' && (url.startsWith('/dashboard') || url.startsWith('/onboarding'))) {
      return NextResponse.redirect(new URL('/backoffice', request.url))
    }

    // Redirection Admin sans club (Forcer Onboarding)
    if (profile?.role === 'admin' && !profile.club_id && url !== '/onboarding' && !url.startsWith('/_next')) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Empêcher Onboarding si déjà fait
    if (profile?.club_id && url === '/onboarding') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}