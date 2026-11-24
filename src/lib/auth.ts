import { SignJWT, jwtVerify } from 'jose'
import { cookies, headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

// Secret de signature des sessions.
// - production : AUTH_SECRET est OBLIGATOIRE — en son absence, la signature
//   lève une erreur (fail-closed) plutôt que de retomber sur une valeur
//   publique codée en dur qui permettrait de forger des sessions.
// - dev : repli sur une valeur par défaut pour rester utilisable sans config.
const DEV_FALLBACK_SECRET = 'vigie-media-secret-key-change-in-production-2026'

function sessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (secret) return new TextEncoder().encode(secret)
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET manquant en production — authentification désactivée (fail-closed).')
  }
  return new TextEncoder().encode(DEV_FALLBACK_SECRET)
}
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
    .sign(sessionSecret())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret())
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

/**
 * Détecte si la requête arrive en HTTPS (directement ou derrière un proxy,
 * ex. préview). Utilise x-forwarded-proto puis l'en-tête Origin du navigateur.
 */
async function isHttpsRequest(): Promise<boolean> {
  const h = await headers()
  const fwd = h.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase()
  if (fwd) return fwd === 'https'
  const origin = h.get('origin')
  if (origin) {
    try {
      return new URL(origin).protocol === 'https:'
    } catch {
      /* Origin malformé : on ignore */
    }
  }
  return false
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload)
  const store = await cookies()
  const https = await isHttpsRequest()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // En HTTPS (préview, production) : SameSite=None + Secure — indispensable
    // pour que la session soit conservée quand le site est affiché dans un
    // encadré multi-origine (iframe), sinon la connexion « ne tient pas ».
    // En local HTTP : SameSite=Lax (None serait rejeté sans Secure).
    secure: https,
    sameSite: https ? 'none' : 'lax',
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
