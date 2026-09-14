import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { getSettings, setSettings } from '@/lib/settings'
import { logActivity } from '@/lib/activity'

// ---------- GET /api/admin/settings ----------
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const settings = await getSettings()
  return NextResponse.json({ settings })
}

// ---------- PUT /api/admin/settings — réglages globaux (§6.9) ----------
export async function PUT(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })

  // Champs autorisés uniquement (pas d’injection de clés arbitraires)
  const allowedKeys = [
    'site_name', 'site_slogan', 'site_logo', 'site_favicon', 'accent_color',
    'seo_default_title', 'seo_default_description', 'seo_og_image',
    'social_twitter', 'social_instagram', 'social_linkedin', 'social_youtube',
    'contact_email', 'contact_intro', 'tips_enabled',
    'custom_head_scripts', 'maintenance_mode', 'maintenance_message',
    'footer_text', 'newsletter_intro', 'comments_moderation',
  ]
  const updates: Record<string, string> = {}
  for (const key of allowedKeys) {
    if (key in body) updates[key] = String(body[key] ?? '')
  }
  await setSettings(updates)
  await logActivity('SETTINGS_UPDATE', Object.keys(updates).join(','))
  const settings = await getSettings()
  return NextResponse.json({ settings })
}
