import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getPublishedArticles } from '@/lib/public-queries'
import { ArticleCardRow } from '@/components/site/article-card'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { Pagination } from '@/components/site/pagination'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

async function getTag(slug: string) {
  return db.tag.findUnique({ where: { slug } })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tag = await getTag(slug)
  return { title: tag ? `#${tag.name}` : 'Mot-clé introuvable' }
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const perPage = 10

  const tag = await getTag(slug)
  if (!tag) notFound()

  const { items, total } = await getPublishedArticles({ tagSlug: slug, page, perPage })
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <Breadcrumb items={[{ label: 'Mots-clés', href: '/tags' }, { label: `#${tag.name}` }]} />
      <h1 className="mt-4 font-display text-4xl font-bold">#{tag.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{total} article{total > 1 ? 's' : ''} lié{total > 1 ? 's' : ''} à ce mot-clé</p>

      <div className="mt-8 space-y-6">
        {items.map((a) => (
          <ArticleCardRow key={a.id} article={a} />
        ))}
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-10 text-center font-display text-xl italic text-muted-foreground">
            Aucun article avec ce mot-clé.
          </p>
        )}
      </div>

      <div className="mt-10">
        <Pagination page={page} totalPages={totalPages} basePath={`/tag/${slug}`} />
      </div>
    </div>
  )
}
