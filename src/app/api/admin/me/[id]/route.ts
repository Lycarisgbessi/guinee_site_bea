import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, getSession, hashPassword, verifyPassword } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

type Props = { params: Promise<{ id: string }> }

// ---------- PUT /api/admin/me/:id — profil + mot de passe ----------
export async function PUT(req: Request, { params }: Props) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  if (id !== session.userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const user = await db.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  const data: Record<string, string> = {}
  if (typeof body?.name === 'string' && body.name.trim().length >= 2) data.name = body.name.trim()
  if (typeof body?.bio === 'string') data.bio = body.bio
  if (typeof body?.avatar === 'string') data.avatar = body.avatar

  if (body?.newPassword) {
    if (typeof body.newPassword !== 'string' || body.newPassword.length < 8) {
      return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' }, { status: 400 })
    }
    const ok = await verifyPassword(body.currentPassword || '', user.password)
    if (!ok) return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 403 })
    data.password = await hashPassword(body.newPassword)
  }

  await db.user.update({ where: { id }, data })
  await logActivity('PROFILE_UPDATE', user.email)
  return NextResponse.json({ ok: true })
}
