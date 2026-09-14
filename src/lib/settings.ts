import { db } from '@/lib/db'

// Réglages par défaut — tous modifiables depuis le dashboard (§6.9)
export const DEFAULT_SETTINGS: Record<string, string> = {
  site_name: 'La Vigie',
  site_slogan: 'Un regard exigeant sur le monde',
  site_logo: '/logo.svg',
  site_favicon: '/favicon.svg',
  accent_color: '#A03123',
  seo_default_title: 'La Vigie — Média indépendant',
  seo_default_description:
    'La Vigie, média digital indépendant : reportages, enquêtes, interviews et analyses au format long. Un journalisme exigeant, au service du débat public.',
  seo_og_image: '',
  social_twitter: 'https://twitter.com/lavigie',
  social_instagram: 'https://instagram.com/lavigie',
  social_linkedin: 'https://linkedin.com/company/lavigie',
  social_youtube: '',
  contact_email: 'redaction@lavigie.fr',
  contact_intro:
    'Une question, une réaction, une information à nous transmettre ? L’équipe de La Vigie vous lit attentivement et répond sous 48 heures ouvrées.',
  tips_enabled: 'true',
  custom_head_scripts: '',
  maintenance_mode: 'false',
  maintenance_message:
    'La Vigie fait peau neuve. Nous revenons dans quelques instants avec un site encore plus beau. Merci de votre patience.',
  footer_text: 'La Vigie est un média indépendant financé par ses lecteurs. Chaque article est vérifié, sourcé et relu avant publication.',
  newsletter_intro: 'Recevez chaque vendredi la sélection de la rédaction : nos meilleurs reportages, enquêtes et interviews, directement dans votre boîte mail. Sans spam, désinscription en un clic.',
  comments_moderation: 'true',
}

type SettingsCache = {
  data: Record<string, string>
  expiresAt: number
}

const globalCache = globalThis as unknown as { __settingsCache?: SettingsCache }

/** Lit tous les réglages du site (cache mémoire 5 s pour la performance) */
export async function getSettings(): Promise<Record<string, string>> {
  const now = Date.now()
  if (globalCache.__settingsCache && globalCache.__settingsCache.expiresAt > now) {
    return globalCache.__settingsCache.data
  }
  try {
    const rows = await db.siteSetting.findMany()
    const data = { ...DEFAULT_SETTINGS }
    for (const row of rows) data[row.key] = row.value
    globalCache.__settingsCache = { data, expiresAt: now + 5000 }
    return data
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

/** Lit un réglage précis */
export async function getSetting(key: string): Promise<string> {
  const all = await getSettings()
  return all[key] ?? ''
}

/** Écrit un ou plusieurs réglages */
export async function setSettings(values: Record<string, string>) {
  for (const [key, value] of Object.entries(values)) {
    await db.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }
  globalCache.__settingsCache = undefined
}
