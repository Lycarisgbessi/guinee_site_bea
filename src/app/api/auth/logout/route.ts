import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth'

/** POST /api/auth/logout — déconnexion */
export async function POST() {
  await clearSessionCookie()
  return NextResponse.json({ ok: true })
}
