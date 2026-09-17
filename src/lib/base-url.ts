import { headers } from 'next/headers'
import { existsSync } from 'node:fs'
import path from 'node:path'

/**
 * Origine publique du site (ex. « https://preview-abc.space-z.ai »), déduite
 * des en-têtes de la requête entrante.
 *
 * Indispensable pour produire des balises Open Graph en URL ABSOLUE : les
 * crawlers des réseaux sociaux (facebookexternalhit, WhatsApp, LinkedIn,
 * Twitterbot…) ne savent pas résoudre les chemins relatifs, et sans
 * metadataBase Next.js retombe sur « http://localhost:3000 » — une adresse
 * invisible depuis l'extérieur. C'est pourquoi Facebook affichait le logo
 * du site au lieu de l'image de l'article.
 */
export async function getBaseUrl(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto =
    h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

/**
 * Transforme un chemin d'image en URL absolue exploitable par les crawlers.
 * Une URL déjà absolue (http…/https…) est conservée telle quelle.
 */
export function absoluteUrl(
  pathOrUrl: string | null | undefined,
  base: string,
): string | undefined {
  if (!pathOrUrl) return undefined
  try {
    return new URL(pathOrUrl, base).toString()
  } catch {
    return undefined
  }
}

/**
 * Dimensions d'une image locale servie depuis /public — ajoutées aux balises
 * og:image:width / og:image:height pour que Facebook affiche l'aperçu
 * instantanément, sans devoir retélécharger l'image pour en mesurer le format.
 * Retourne undefined pour une URL externe ou un fichier introuvable
 * (les dimensions sont un bonus, jamais une erreur bloquante).
 */
export async function imageSizeOf(
  pathOrUrl: string | null | undefined,
): Promise<{ width: number; height: number } | undefined> {
  if (!pathOrUrl || !pathOrUrl.startsWith('/') || pathOrUrl.startsWith('//')) {
    return undefined
  }
  try {
    const filePath = path.join(process.cwd(), 'public', pathOrUrl.replace(/^\/+/, ''))
    if (!existsSync(filePath)) return undefined
    const sharp = (await import('sharp')).default
    const meta = await sharp(filePath).metadata()
    if (meta.width && meta.height) return { width: meta.width, height: meta.height }
  } catch {
    /* silencieux : dimensions optionnelles */
  }
  return undefined
}
