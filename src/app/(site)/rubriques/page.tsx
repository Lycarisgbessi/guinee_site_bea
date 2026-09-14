import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'

import { getVisibleCategories } from '@/lib/public-queries'
import { Reveal } from '@/components/site/reveal'
import { Breadcrumb } from '@/components/site/breadcrumb'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Rubriques' }

export default async function CategoriesPage() {
  const categories = await getVisibleCategories()

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <Breadcrumb items={[{ label: 'Rubriques' }]} />
      <h1 className="mt-4 font-display text-4xl font-bold">Toutes les rubriques</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
        Explorez les grands chantiers de La Vigie, rubrique par rubrique. Chaque espace réunit nos articles,
        reportages et interviews sur un même territoire éditorial.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, i) => (
          <Reveal key={c.id} delay={i * 0.07}>
            <Link
              href={`/rubrique/${c.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-lg border border-border/70 bg-card transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative overflow-hidden">
                {c.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.coverImage}
                    alt=""
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ aspectRatio: '16/9' }}
                  />
                )}
                <div
                  className="absolute inset-x-0 bottom-0 h-1"
                  style={{ background: c.color || 'var(--brand)' }}
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold" style={{ color: c.color || undefined }}>
                    {c.name}
                  </h2>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                </div>
                {c.description && (
                  <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-muted-foreground">{c.description}</p>
                )}
                <p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {c._count.articles} article{c._count.articles > 1 ? 's' : ''}
                </p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
