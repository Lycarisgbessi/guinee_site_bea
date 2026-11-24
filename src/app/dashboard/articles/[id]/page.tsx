'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ArticleEditorForm } from '@/components/dashboard/article-editor-form'
import { toast } from 'sonner'

/** Édition d’un article avec historique de versions (§6.4) */
export default function EditArticlePage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [article, setArticle] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/admin/articles/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setArticle(d.article)
      })
      .catch((e) => {
        setError(e.message)
        toast.error(e.message)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !article) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Article introuvable.</p>
  }

   
  const a = article as any

  return (
    <ArticleEditorForm
      isNew={false}
      initial={{
        id: a.id,
        title: a.title,
        slug: a.slug,
        subtitle: a.subtitle,
        chapo: a.chapo,
        contentJson: a.contentJson ? JSON.parse(a.contentJson) : { type: 'doc', content: [] },
        format: a.format,
        status: a.status,
        scheduledAt: a.scheduledAt,
        publishedAt: a.publishedAt,
        coverImage: a.coverImage,
        coverCredit: a.coverCredit,
        seoTitle: a.seoTitle,
        seoDescription: a.seoDescription,
        featured: a.featured,
        commentsEnabled: a.commentsEnabled,
        categoryIds: (a.categories ?? []).map((c: { categoryId: string }) => c.categoryId),
        tagIds: (a.tags ?? []).map((t: { tagId: string }) => t.tagId),
        versions: a.versions ?? [],
      }}
    />
  )
}
