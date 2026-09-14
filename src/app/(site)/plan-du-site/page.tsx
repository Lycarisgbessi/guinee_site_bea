import Link from 'next/link'
import { db } from '@/lib/db'
import { publicVisibilityWhere } from '@/lib/public-queries'
import { Breadcrumb } from '@/components/site/breadcrumb'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Plan du site' }

/** Plan du site (§5.7) */
export default async function SitemapPage() {
  const [categories, articles, pages, tags] = await Promise.all([
    db.category.findMany({ where: { visible: true }, orderBy: { order: 'asc' } }),
    db.article.findMany({
      where: publicVisibilityWhere(),
      orderBy: { publishedAt: 'desc' },
      select: { slug: true, title: true },
    }),
    db.page.findMany({ where: { published: true }, select: { slug: true, title: true } }),
    db.tag.findMany({ take: 20, orderBy: { name: 'asc' }, select: { slug: true, name: true } }),
  ])

  const staticLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/rubriques', label: 'Rubriques' },
    { href: '/a-propos', label: 'À propos' },
    { href: '/contact', label: 'Contact' },
    { href: '/recherche', label: 'Recherche' },
    { href: '/archives', label: 'Archives' },
    { href: '/tags', label: 'Mots-clés' },
    { href: '/newsletter', label: 'Newsletter' },
    { href: '/api/rss', label: 'Flux RSS' },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <Breadcrumb items={[{ label: 'Plan du site' }]} />
      <h1 className="mt-4 font-display text-4xl font-bold">Plan du site</h1>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="eyebrow mb-4 text-muted-foreground">Pages principales</h2>
          <ul className="space-y-2 text-[15px]">
            {staticLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-brand">{l.label}</Link>
              </li>
            ))}
          </ul>

          <h2 className="eyebrow mb-4 mt-8 text-muted-foreground">Rubriques</h2>
          <ul className="space-y-2 text-[15px]">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/rubrique/${c.slug}`} className="transition-colors hover:text-brand">{c.name}</Link>
              </li>
            ))}
          </ul>

          <h2 className="eyebrow mb-4 mt-8 text-muted-foreground">Pages légales</h2>
          <ul className="space-y-2 text-[15px]">
            {pages.map((p) => (
              <li key={p.slug}>
                <Link href={`/p/${p.slug}`} className="transition-colors hover:text-brand">{p.title}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="eyebrow mb-4 text-muted-foreground">Articles ({articles.length})</h2>
          <ul className="nice-scroll max-h-[520px] space-y-2 overflow-y-auto pr-3 text-[14px]">
            {articles.map((a) => (
              <li key={a.slug}>
                <Link href={`/article/${a.slug}`} className="transition-colors hover:text-brand">{a.title}</Link>
              </li>
            ))}
          </ul>

          <h2 className="eyebrow mb-4 mt-8 text-muted-foreground">Mots-clés</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Link
                key={t.slug}
                href={`/tag/${t.slug}`}
                className="rounded-full border border-border/80 px-3 py-1 text-[13px] transition-colors hover:border-brand hover:text-brand"
              >
                #{t.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
