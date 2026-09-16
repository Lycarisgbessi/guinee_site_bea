import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { db } from '@/lib/db'
import { getPublishedArticles } from '@/lib/public-queries'
import { ArticleCard, ArticleCardRow, CategoryBadge } from '@/components/site/article-card'
import { Reveal, Stagger, StaggerItem } from '@/components/site/reveal'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { Pagination } from '@/components/site/pagination'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; format?: string }>
}

async function getCategory(slug: string) {
  return db.category.findFirst({ where: { slug, visible: true } })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategory(slug)
  if (!category) return { title: 'Rubrique introuvable' }
  return {
    title: category.name,
    description: category.description || `Tous les articles de la rubrique ${category.name}.`,
    openGraph: { images: category.coverImage ? [category.coverImage] : undefined },
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageParam, format } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const perPage = 9

  const category = await getCategory(slug)
  if (!category) notFound()

  const { items, total } = await getPublishedArticles({
    categorySlug: slug,
    page,
    perPage,
    format: format || undefined,
  })
  const totalPages = Math.max(1, Math.ceil(total / perPage))
   
  const doc = items[0] as any

  const formats = [
    { value: '', label: 'Tous les formats' },
    { value: 'ARTICLE', label: 'Articles' },
    { value: 'REPORTAGE', label: 'Reportages' },
    { value: 'INTERVIEW', label: 'Interviews' },
    { value: 'PORTFOLIO', label: 'Portfolios' },
    { value: 'VIDEO', label: 'Vidéos' },
  ]

  return (
    <div>
      {/* En-tête visuel de la rubrique (§5.4) */}
      <div className="relative overflow-hidden border-b border-border/60 bg-secondary/40">
        {category.coverImage && (
           
          <img src={category.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        )}
        <div className="relative mx-auto max-w-6xl px-4 py-14 md:px-6">
          <Breadcrumb items={[{ label: 'Rubriques', href: '/rubriques' }, { label: category.name }]} />
          <span
            className="eyebrow mt-4 inline-block rounded-full px-3 py-1"
            style={{ background: category.color || 'var(--brand)', color: 'var(--brand-foreground)' }}
          >
            Rubrique
          </span>
          <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">{category.name}</h1>
          {category.description && (
            <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">{category.description}</p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">{total} article{total > 1 ? 's' : ''} publié{total > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filtres par format */}
      <div className="mx-auto max-w-6xl px-4 pt-8 md:px-6">
        <div className="flex flex-wrap gap-2">
          {formats.map((f) => {
            const active = (format || '') === f.value
            return (
              <Link
                key={f.value}
                href={`/rubrique/${slug}${f.value ? `?format=${f.value}` : ''}`}
                className={`rounded-full border px-4 py-1.5 text-[13px] transition-colors ${
                  active ? 'border-brand bg-brand text-[color:var(--brand-foreground)]' : 'border-border text-foreground/70 hover:border-foreground/40'
                }`}
              >
                {f.label}
              </Link>
            )
          })}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mx-auto max-w-6xl px-4 py-20 text-center md:px-6">
          <p className="font-display text-2xl italic text-muted-foreground">Aucun article dans ce filtre pour le moment.</p>
        </div>
      ) : page === 1 ? (
        /* Grille premium : premier article en grand */
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          <Reveal>
            <div className="grid gap-8 border-b border-border/60 pb-10 lg:grid-cols-2">
              <Link href={`/article/${items[0].slug}`} className="group block overflow-hidden rounded-lg">
                {items[0].coverImage && (
                   
                  <img
                    src={items[0].coverImage}
                    alt=""
                    className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    style={{ aspectRatio: '16/10' }}
                  />
                )}
              </Link>
              <div className="flex flex-col justify-center">
                {items[0].categories[0]?.category && <CategoryBadge {...items[0].categories[0].category} size="lg" />}
                <h2 className="mt-2 font-display text-3xl font-bold leading-tight">
                  <Link href={`/article/${items[0].slug}`} className="transition-colors hover:text-brand">
                    {items[0].title}
                  </Link>
                </h2>
                {items[0].chapo && <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{items[0].chapo}</p>}
              </div>
            </div>
          </Reveal>
          <Stagger className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3" gap={0.08}>
            {items.slice(1).map((a) => (
              <StaggerItem key={a.id}>
                <ArticleCard article={a} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          <Stagger className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" gap={0.08}>
            {items.map((a) => (
              <StaggerItem key={a.id}>
                <ArticleCard article={a} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 pb-14 md:px-6">
        <Pagination page={page} totalPages={totalPages} basePath={`/rubrique/${slug}`} extraParams={format ? { format } : {}} />
      </div>
    </div>
  )
}
