import Link from 'next/link'
import type { Metadata } from 'next'
import { CalendarDays } from 'lucide-react'

import { db } from '@/lib/db'
import { publicVisibilityWhere } from '@/lib/public-queries'
import { ArticleCardRow } from '@/components/site/article-card'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { Stagger, StaggerItem } from '@/components/site/reveal'
import { Pagination } from '@/components/site/pagination'
import { AdBanner } from '@/components/site/ad-banner'
import { formatDateShortFr } from '@/lib/shared'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Archives' }

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

type Props = { searchParams: Promise<{ page?: string; mois?: string; annee?: string }> }

/** Navigation par mois / année (§5.7) */
export default async function ArchivesPage({ searchParams }: Props) {
  const { page: pageParam, mois, annee } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const perPage = 10

  const month = mois ? parseInt(mois, 10) : undefined
  const year = annee ? parseInt(annee, 10) : undefined

  let start: Date | undefined
  let end: Date | undefined
  if (year) {
    start = new Date(year, month ? month - 1 : 0, 1)
    end = new Date(year, month ?? 12, 1)
  }

  const where = {
    ...publicVisibilityWhere(),
    ...(start && end ? { publishedAt: { gte: start, lt: end } } : {}),
  }

  const [items, total] = await Promise.all([
    db.article.findMany({
      where,
      include: { author: { select: { name: true } }, categories: { include: { category: true } }, tags: { include: { tag: true } } },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.article.count({ where }),
  ])

  // Années disponibles
  const oldest = await db.article.findFirst({
    where: publicVisibilityWhere(),
    orderBy: { publishedAt: 'asc' },
    select: { publishedAt: true },
  })
  const nowYear = new Date().getFullYear()
  const minYear = oldest?.publishedAt ? oldest.publishedAt.getFullYear() : nowYear
  const years: number[] = []
  for (let y = nowYear; y >= minYear; y--) years.push(y)

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  const buildHref = (p?: number, m?: string, y?: string) => {
    const params = new URLSearchParams()
    if (p && p > 1) params.set('page', String(p))
    if (m) params.set('mois', m)
    if (y) params.set('annee', y)
    const qs = params.toString()
    return qs ? `/archives?${qs}` : '/archives'
  }

  const currentLabel = year
    ? month
      ? `${MONTHS[month - 1]} ${year}`
      : `Année ${year}`
    : 'Tous les articles'

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <Breadcrumb items={[{ label: 'Archives' }]} />
      <div className="mt-4 flex items-center gap-3">
        <CalendarDays className="h-7 w-7 text-brand" />
        <h1 className="font-display text-4xl font-bold">Archives</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {currentLabel} — {total} article{total > 1 ? 's' : ''}
      </p>

      {/* Espace publicitaire archives */}
      <div className="mt-6">
        <AdBanner slot="RUBRIQUE_TOP" className="w-full" />
      </div>

      {/* Navigation mois / année */}
      <div className="mt-6 flex flex-wrap gap-1.5">
        <Link
          href={buildHref(1)}
          className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
            !year ? 'border-brand bg-brand text-[color:var(--brand-foreground)]' : 'border-border text-foreground/70 hover:border-foreground/40'
          }`}
        >
          Tout
        </Link>
        {years.map((y) => (
          <span key={y} className="flex overflow-hidden rounded-full border border-border">
            <Link
              href={buildHref(1, undefined, String(y))}
              className={`px-3 py-1.5 text-[13px] transition-colors ${
                year === y && !month ? 'bg-brand text-[color:var(--brand-foreground)]' : 'text-foreground/70 hover:bg-secondary'
              }`}
            >
              {y}
            </Link>
            {year === y &&
              MONTHS.map((label, idx) => (
                <Link
                  key={label}
                  href={buildHref(1, String(idx + 1), String(y))}
                  className={`px-2.5 py-1.5 text-[13px] transition-colors ${
                    month === idx + 1 ? 'bg-brand text-[color:var(--brand-foreground)]' : 'text-foreground/60 hover:bg-secondary'
                  }`}
                >
                  {label.slice(0, 3)}
                </Link>
              ))}
          </span>
        ))}
      </div>

      <Stagger className="mt-8 space-y-6" gap={0.06}>
        {items.map((a) => (
          <StaggerItem key={a.id}>
            <p className="mb-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {a.publishedAt ? formatDateShortFr(a.publishedAt) : ''}
            </p>
            <ArticleCardRow article={a as never} />
          </StaggerItem>
        ))}
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-10 text-center font-display text-xl italic text-muted-foreground">
            Aucun article pour cette période.
          </p>
        )}
      </Stagger>

      <div className="mt-10">
        <Pagination
          page={page}
          totalPages={totalPages}
          basePath="/archives"
          extraParams={{ ...(mois ? { mois } : {}), ...(annee ? { annee } : {}) }}
        />
      </div>
    </div>
  )
}
