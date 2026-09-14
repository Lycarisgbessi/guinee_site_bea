'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Loader2, MessageSquare, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateFr } from '@/lib/shared'

interface CommentRow {
  id: string
  authorName: string
  email: string
  content: string
  status: string
  createdAt: string
  article: { slug: string; title: string }
}

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  PENDING: { cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', label: 'En attente' },
  APPROVED: { cls: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400', label: 'Approuvé' },
  REJECTED: { cls: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400', label: 'Rejeté' },
}

/** Modération des commentaires (§6.8) */
export default function CommentsPage() {
  const [items, setItems] = useState<CommentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('PENDING')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/comments${status !== 'ALL' ? `?status=${status}` : ''}`)
    const data = await res.json()
    if (res.ok) setItems(data.items)
    else toast.error(data.error)
    setLoading(false)
  }, [status])

  useEffect(() => {
    const raf = requestAnimationFrame(load)
    return () => cancelAnimationFrame(raf)
  }, [load])

  async function moderate(id: string, newStatus: string) {
    const res = await fetch(`/api/admin/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      toast.success(newStatus === 'APPROVED' ? 'Commentaire approuvé et publié.' : 'Commentaire rejeté.')
      load()
    } else toast.error('Erreur')
  }

  async function remove(id: string) {
    if (!window.confirm('Supprimer définitivement ce commentaire ?')) return
    const res = await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Commentaire supprimé.')
      load()
    } else toast.error('Erreur')
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Commentaires</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Modération a priori : les lecteurs ne voient que les commentaires approuvés.
        </p>
      </div>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="h-9 w-44"><MessageSquare className="h-3.5 w-3.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="PENDING">En attente</SelectItem>
          <SelectItem value="APPROVED">Approuvés</SelectItem>
          <SelectItem value="REJECTED">Rejetés</SelectItem>
          <SelectItem value="ALL">Tous</SelectItem>
        </SelectContent>
      </Select>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">Aucun commentaire dans ce filtre.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold">
                    {c.authorName}
                    <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${STATUS_BADGE[c.status]?.cls}`}>{STATUS_BADGE[c.status]?.label}</span>
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                    {c.email} · {formatDateFr(c.createdAt)} · sur « {c.article?.title} »
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {c.status !== 'APPROVED' && (
                    <Button size="sm" onClick={() => moderate(c.id, 'APPROVED')} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-600/90">
                      <Check className="h-3.5 w-3.5" /> Approuver
                    </Button>
                  )}
                  {c.status !== 'REJECTED' && (
                    <Button size="sm" variant="outline" onClick={() => moderate(c.id, 'REJECTED')} className="gap-1.5">
                      <X className="h-3.5 w-3.5" /> Rejeter
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(c.id)} className="gap-1.5 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="mt-2.5 rounded-md bg-secondary/50 p-3 text-[14px] leading-relaxed text-foreground/90">{c.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
