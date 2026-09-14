import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'vigie-media-secret-key-change-in-production-2026'
)
export const SESSION_COOKIE = 'vigie_session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 jours

export interface SessionPayload {
  userId: string
  email: string
  name: string
  role: string
}

// ---------- Mots de passe ----------
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// ---------- Session JWT ----------
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET)
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    }
  } catch {
    return null
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

/** Récupère la session courante (côté serveur : RSC / route handlers) */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

/** Authentifie un utilisateur (email + mot de passe) et ouvre la session */
export async function login(email: string, password: string): Promise<SessionPayload | null> {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!user || user.status !== 'ACTIF') return null
  const ok = await verifyPassword(password, user.password)
  if (!ok) return null
  const payload: SessionPayload = { userId: user.id, email: user.email, name: user.name, role: user.role }
  await setSessionCookie(payload)
  return payload
}

/** Vérifie que la requête provient d'un admin authentifié (routes /api/admin/*) */
export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await getSession()
  if (!session) return null
  if (!['ADMIN', 'EDITEUR', 'RELECTEUR'].includes(session.role)) return null
  return session
}
