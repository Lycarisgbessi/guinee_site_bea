import { db } from '@/lib/db'
import { RichContent } from '@/components/article/rich-content'
import { Reveal } from '@/components/site/reveal'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

/** Métadonnées SEO pilotées par la page CMS (éditable dans Dashboard → Pages) */
export async function generateMetadata(): Promise<Metadata> {
  const page = await db.page.findFirst({ where: { slug: 'a-propos', published: true } })
  return {
    title: page?.seoTitle || page?.title || 'À propos',
    description: page?.seoDescription || undefined,
  }
}

/** Page « À propos » 100 % éditable depuis le dashboard (§5.2, §6.5) */
export default async function AboutPage() {
  const page = await db.page.findFirst({ where: { slug: 'a-propos', published: true } })
  if (!page) notFound()
   
  const doc = JSON.parse(page.contentJson || '{}')

  return (
    <div className="pb-16">
      {/* Hero pleine largeur */}
      {page.heroImage && (
        <div className="relative flex h-[340px] items-end overflow-hidden md:h-[440px]">
          { }
          <img src={page.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 md:px-6">
            <span className="eyebrow text-white/80">Le média</span>
            <h1 className="mt-2 font-display text-4xl font-bold text-white md:text-6xl">{page.title}</h1>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 pt-12 md:px-6">
        {!page.heroImage && <h1 className="font-display text-4xl font-bold">{page.title}</h1>}
        <Reveal>
          <RichContent doc={doc} dropcap />
        </Reveal>
      </div>
    </div>
  )
}
