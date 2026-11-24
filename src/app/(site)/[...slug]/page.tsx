import { permanentRedirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { RichContent } from '@/components/article/rich-content'
import { Breadcrumb } from '@/components/site/breadcrumb'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string[] }> }

/**
 * Route attrape-tout du site public (§9, §12.2) :
 * 1. applique les redirections 301 configurées dans le dashboard
 * 2. sert les pages CMS publiées (ex. /mentions-legales sans préfixe)
 * 3. déclenche la 404 personnalisée sinon
 */
export default async function CatchAllPage({ params }: Props) {
  const { slug } = await params
  const path = '/' + slug.join('/')

  // 1. Redirections gérées depuis le dashboard
  const redirect = await db.redirect.findUnique({ where: { fromPath: path } })
  if (redirect) permanentRedirect(redirect.toPath)

  // 2. Page CMS publiée ?
  const page = await db.page.findFirst({ where: { slug: slug[slug.length - 1], published: true } })
  if (page) {
     
    const doc = JSON.parse(page.contentJson || '{}')
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <Breadcrumb items={[{ label: page.title }]} />
        <h1 className="mt-4 font-display text-4xl font-bold">{page.title}</h1>
        <div className="mt-8">
          <RichContent doc={doc} />
        </div>
      </div>
    )
  }

  // 3. Rien trouvé → 404 éditoriale
  notFound()
}
