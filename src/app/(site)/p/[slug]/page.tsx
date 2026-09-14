import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { db } from '@/lib/db'
import { RichContent } from '@/components/article/rich-content'
import { Breadcrumb } from '@/components/site/breadcrumb'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

async function getPage(slug: string) {
  return db.page.findFirst({ where: { slug, published: true } })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return { title: 'Page introuvable' }
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
    openGraph: { images: page.heroImage ? [page.heroImage] : undefined },
  }
}

/** Rendu des pages statiques éditables depuis le dashboard (§6.5) */
export default async function CmsPage({ params }: Props) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = JSON.parse(page.contentJson || '{}')

  return (
    <div className="pb-16">
      {page.heroImage && (
        <div className="relative h-[300px] overflow-hidden md:h-[380px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={page.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
          <div className="absolute bottom-0 left-0 right-0">
            <div className="mx-auto max-w-4xl px-4 pb-8 md:px-6">
              <h1 className="font-display text-4xl font-bold text-white md:text-5xl">{page.title}</h1>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 pt-10 md:px-6">
        {!page.heroImage && (
          <>
            <Breadcrumb items={[{ label: page.title }]} />
            <h1 className="mt-4 font-display text-4xl font-bold">{page.title}</h1>
          </>
        )}
        <div className="mt-8">
          <RichContent doc={doc} />
        </div>
      </div>
    </div>
  )
}
