'use client'

import { ArticleEditorForm } from '@/components/dashboard/article-editor-form'

/** Création d’un article (§6.4) */
export default function NewArticlePage() {
  return (
    <ArticleEditorForm
      isNew
      initial={{
        title: '',
        format: 'ARTICLE',
        status: 'DRAFT',
        contentJson: { type: 'doc', content: [] },
        featured: false,
        commentsEnabled: true,
        categoryIds: [],
        tagIds: [],
      }}
    />
  )
}
