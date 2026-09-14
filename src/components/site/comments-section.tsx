'use client'

import { useState } from 'react'
import { Loader2, MessageSquare, Send } from 'lucide-react'
import { toast } from 'sonner'
import { formatDateShortFr } from '@/lib/shared'

interface CommentItem {
  id: string
  authorName: string
  content: string
  createdAt: string | Date
}

/** Espace commentaires avec modération a priori (§6.8) */
export function CommentsSection({
  articleId,
  comments,
}: {
  articleId: string
  comments: CommentItem[]
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, authorName: name, email, content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      toast.success('Merci ! Votre commentaire sera publié après validation par la rédaction.')
      setName('')
      setEmail('')
      setContent('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l’envoi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-14 border-t border-border/60 pt-10" aria-label="Commentaires">
      <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
        <MessageSquare className="h-5 w-5 text-brand" />
        Commentaires ({comments.length})
      </h2>

      {comments.length > 0 ? (
        <ul className="mt-6 space-y-5">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-border/70 bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-[14.5px]">{c.authorName}</span>
                <time className="text-xs text-muted-foreground">{formatDateShortFr(c.createdAt)}</time>
              </div>
              <p className="mt-2 text-[14.5px] leading-relaxed text-foreground/85">{c.content}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Soyez le premier à réagir — les commentaires sont validés par la rédaction avant publication.
        </p>
      )}

      <form onSubmit={submit} className="mt-8 rounded-lg border border-border/70 bg-secondary/40 p-6">
        <h3 className="font-display text-lg font-semibold">Participer à la discussion</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom *"
            aria-label="Votre nom"
            className="h-11 rounded-md border border-input bg-background px-3.5 text-sm outline-none focus:border-brand"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre email (non publié) *"
            aria-label="Votre email"
            className="h-11 rounded-md border border-input bg-background px-3.5 text-sm outline-none focus:border-brand"
          />
        </div>
        <textarea
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Votre commentaire * (10 à 2 000 caractères)"
          aria-label="Votre commentaire"
          className="mt-3 w-full rounded-md border border-input bg-background px-3.5 py-3 text-sm outline-none focus:border-brand"
        />
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Vos données ne sont jamais publiées. Modération a priori (RGPD).
          </p>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-md px-5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Envoyer
          </button>
        </div>
      </form>
    </section>
  )
}
