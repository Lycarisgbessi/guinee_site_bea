import { db } from '@/lib/db'
import { getSettings } from '@/lib/settings'

/**
 * Emplacements publicitaires stratégiques (§7 — régie interne).
 * Chaque emplacement correspond à un point d'attention éprouvé :
 *  - sous le header   : visibilité maximale, toutes les pages ;
 *  - au cœur d'accueil : entre deux sections, dans le flux de lecture ;
 *  - colonne d'article : persistent pendant la lecture (sticky) ;
 *  - fin d'article    : lecteur engagé, taux de clic élevé ;
 *  - pré-footer       : grande bannière de clôture ;
 *  - tête de rubrique : trafic thématique qualifié.
 */
export const AD_SLOTS: { key: string; label: string; hint: string; ratio: string }[] = [
  {
    key: 'HEADER_LEADERBOARD',
    label: 'Bannière haute (toutes les pages)',
    hint: 'Sous le menu principal — visibilité maximale, format large 728×90 environ.',
    ratio: 'aspect-[8/1] max-h-32',
  },
  {
    key: 'HOMEPAGE_MID',
    label: 'Cœur de la page d’accueil',
    hint: 'Entre deux sections de l’accueil, dans le flux de découverte.',
    ratio: 'aspect-[5/1] max-h-56',
  },
  {
    key: 'ARTICLE_SIDEBAR',
    label: 'Colonne de l’article (sticky)',
    hint: 'À côté du texte, reste visible pendant toute la lecture — format vertical.',
    ratio: 'aspect-[3/4] max-h-[420px]',
  },
  {
    key: 'ARTICLE_END',
    label: 'Fin d’article',
    hint: 'Après la lecture, avant les commentaires — attention maximale.',
    ratio: 'aspect-[5/1] max-h-56',
  },
  {
    key: 'RUBRIQUE_TOP',
    label: 'Tête des rubriques et archives',
    hint: 'En haut des pages thématiques — audience qualifiée.',
    ratio: 'aspect-[6/1] max-h-40',
  },
  {
    key: 'PREFOOTER',
    label: 'Grand billboard pré-footer (toutes les pages)',
    hint: 'Avant le pied de page — bannière de clôture pleine largeur.',
    ratio: 'aspect-[5/1] max-h-56',
  },
]

export function adSlotLabel(key: string): string {
  return AD_SLOTS.find((s) => s.key === key)?.label ?? key
}

/**
 * Sélectionne l'annonce à afficher pour un emplacement :
 * - uniquement les annonces actives dont la période est en cours ;
 * - tirage pondéré par `weight` (rotation équitable à chaque affichage).
 * Incrémente aussi le compteur d'impressions.
 */
export async function pickAd(slot: string) {
  const settings = await getSettings()
  if (settings.ads_enabled !== 'true') return null

  // Filet de sécurité : une panne de la régie (client Prisma périmé après un
  // redémarrage de sandbox, DB momentanément indisponible…) ne doit JAMAIS
  // faire tomber la page entière — l'annonce est simplement omise.
  let ads
  try {
    const now = new Date()
    ads = await db.ad.findMany({
      where: {
        slot,
        active: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
    })
  } catch {
    return null
  }
  if (ads.length === 0) return null

  const total = ads.reduce((sum, a) => sum + Math.max(1, a.weight), 0)
  let roll = Math.random() * total
  let chosen = ads[ads.length - 1]
  for (const ad of ads) {
    roll -= Math.max(1, ad.weight)
    if (roll <= 0) {
      chosen = ad
      break
    }
  }

  // Statistique d'impression (SQLite local : écriture négligeable)
  db.ad
    .update({ where: { id: chosen.id }, data: { impressions: { increment: 1 } } })
    .catch(() => {})
  return chosen
}
