import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'vigie-media-secret-key-change-in-production-2026'
)
const SESSION_COOKIE = 'vigie_session'

/**
 * Middleware de sécurité (§8.3, §11) :
 * - /dashboard/*  → redirige vers /login si non authentifié
 * - /api/admin/*  → 401 JSON si non authentifié
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(SESSION_COOKIE)?.value

  let authed = false
  if (token) {
    try {
      await jwtVerify(token, SECRET)
      authed = true
    } catch {
      authed = false
    }
  }

  if (pathname.startsWith('/api/admin')) {
    if (!authed) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/dashboard') && !authed) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
}
