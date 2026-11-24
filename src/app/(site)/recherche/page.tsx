import type { Metadata } from 'next'
import { Search } from 'lucide-react'

import { db } from '@/lib/db'
import { articleCardInclude, publicVisibilityWhere } from '@/lib/public-queries'
import { ArticleCardRow } from '@/components/site/article-card'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { Stagger, StaggerItem } from '@/components/site/reveal'
import { Pagination } from '@/components/site/pagination'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Recherche', robots: { index: false } }

type Props = {
  searchParams: Promise<{ q?: string; page?: string; rubrique?: string; format?: string }>
}

/** Recherche full-text sur titre + chapô + contenu (§5.7, §8.2) */
export default async function SearchPage({ searchParams }: Props) {
  const { q = '', page: pageParam, rubrique, format } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const perPage = 10
  const query = q.trim()

  let items: Awaited<ReturnType<typeof fetchResults>>['items'] = []
  let total = 0

  async function fetchResults() {
    const now = new Date()
    const like = query.replace(/[%_]/g, '')
    const where: Prisma.ArticleWhereInput = {
      ...publicVisibilityWhere(),
      ...(rubrique ? { categories: { some: { category: { slug: rubrique, visible: true } } } } : {}),
      ...(format ? { format } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: like, mode: 'insensitive' } },
              { chapo: { contains: like, mode: 'insensitive' } },
              { contentText: { contains: like, mode: 'insensitive' } },
              { subtitle: { contains: like, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
    const [found, count] = await Promise.all([
      db.article.findMany({
        where,
        include: articleCardInclude,
        orderBy: query ? [{ title: 'asc' }] : [{ publishedAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      db.article.count({ where }),
    ])
    return { items: found, total: count }
  }

  if (query || rubrique || format) {
    ;({ items, total } = await fetchResults())
  }

  const categories = await db.category.findMany({ where: { visible: true }, orderBy: { order: 'asc' } })
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <Breadcrumb items={[{ label: 'Recherche' }]} />
      <h1 className="mt-4 flex items-center gap-3 font-display text-4xl font-bold">
        <Search className="h-7 w-7 text-brand" />
        Recherche
      </h1>

      <form action="/recherche" className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          name="q"
          defaultValue={query}
          placeholder="Rechercher dans tous les contenus…"
          aria-label="Terme de recherche"
          className="h-12 flex-1 rounded-md border border-input bg-background px-4 text-[15px] outline-none focus:border-brand"
        />
        <button
          type="submit"
          className="h-12 rounded-md px-6 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
        >
          Rechercher
        </button>
      </form>

      {/* Filtres avancés */}
      <form action="/recherche" className="mt-4 flex flex-wrap items-center gap-3 text-[13px]">
        <input type="hidden" name="q" value={query} />
        <select
          name="rubrique"
          defaultValue={rubrique || ''}
          aria-label="Filtrer par rubrique"
          className="h-9 rounded-md border border-input bg-background px-2.5"
        >
          <option value="">Toutes les rubriques</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select
          name="format"
          defaultValue={format || ''}
          aria-label="Filtrer par format"
          className="h-9 rounded-md border border-input bg-background px-2.5"
        >
          <option value="">Tous les formats</option>
          <option value="ARTICLE">Articles</option>
          <option value="REPORTAGE">Reportages</option>
          <option value="INTERVIEW">Interviews</option>
          <option value="PORTFOLIO">Portfolios</option>
          <option value="VIDEO">Vidéos</option>
        </select>
        <button type="submit" className="text-brand underline underline-offset-4">
          Appliquer les filtres
        </button>
      </form>

      <div className="mt-8">
        {query && (
          <p className="mb-6 text-sm text-muted-foreground">
            {total} résultat{total > 1 ? 's' : ''} pour «&nbsp;<strong className="text-foreground">{query}</strong>&nbsp;»
          </p>
        )}

        {items.length > 0 ? (
          <Stagger className="space-y-6" gap={0.06}>
            {items.map((a) => (
              <StaggerItem key={a.id}>
                <ArticleCardRow article={a} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : query ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <p className="font-display text-xl italic text-muted-foreground">
              Aucun résultat. Essayez avec d’autres mots-clés ou élargissez vos filtres.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-10">
        <Pagination page={page} totalPages={totalPages} basePath="/recherche" extraParams={{ q: query, ...(rubrique ? { rubrique } : {}), ...(format ? { format } : {}) }} />
      </div>
    </div>
  )
}
