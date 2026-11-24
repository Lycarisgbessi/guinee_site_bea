import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SESSION_COOKIE = 'vigie_session'

/**
 * Middleware de sécurité (§8.3, §11) :
 * - /dashboard/*  → redirige vers /login si non authentifié
 * - /api/admin/*  → 401 JSON si non authentifié
 *
 * Fail-closed : en production sans AUTH_SECRET, aucune session n'est
 * considérée valide (impossible de forger un JWT avec un secret public).
 */
function sessionSecret(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET
  if (secret) return new TextEncoder().encode(secret)
  if (process.env.NODE_ENV === 'production') return null
  return new TextEncoder().encode('vigie-media-secret-key-change-in-production-2026')
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(SESSION_COOKIE)?.value
  const secret = sessionSecret()

  let authed = false
  if (token && secret) {
    try {
      await jwtVerify(token, secret)
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
