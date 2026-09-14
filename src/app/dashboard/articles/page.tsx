'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  Archive, Copy, Eye, FileEdit, FilePlus2, Filter, Loader2, RotateCcw,
  Search, Trash2, Undo2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { FORMAT_LABELS, STATUS_LABELS, formatDateShortFr } from '@/lib/shared'

interface ArticleRow {
  id: string
  title: string
  slug: string
  format: string
  status: string
  views: number
  featured: boolean
  scheduledAt: string | null
  publishedAt: string | null
  deletedAt: string | null
  updatedAt: string
  author: { name: string }
  categories: { category: { name: string; color: string } }[]
  _count: { comments: number }
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-secondary text-foreground/70',
  REVIEW: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  SCHEDULED: 'bg-sky-600/15 text-sky-700 dark:text-sky-300',
  PUBLISHED: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400',
  ARCHIVED: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400',
}

/** Gestion des articles / reportages (§6.4) */
export default function ArticlesPage() {
  const [items, setItems] = useState<ArticleRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('ALL')
  const [q, setQ] = useState('')
  const [trashMode, setTrashMode] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ArticleRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status !== 'ALL') params.set('status', status)
    if (q.trim()) params.set('q', q.trim())
    if (trashMode) params.set('trash', '1')
    const res = await fetch(`/api/admin/articles?${params}`)
    const data = await res.json()
    if (res.ok) {
      setItems(data.items)
      setTotal(data.total)
    } else {
      toast.error(data.error)
    }
    setLoading(false)
  }, [status, q, trashMode])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  async function duplicate(id: string) {
    const res = await fetch(`/api/admin/articles/${id}/duplicate`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      toast.success('Article dupliqué en brouillon.')
      load()
    } else toast.error(data.error)
  }

  async function trash(id: string) {
    const res = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Article déplacé dans la corbeille (30 jours).')
      load()
    } else toast.error('Erreur')
  }

  async function restore(id: string) {
    const res = await fetch(`/api/admin/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restore: true }),
    })
    if (res.ok) {
      toast.success('Article restauré.')
      load()
    } else toast.error('Erreur')
  }

  async function deleteForever(id: string) {
    const res = await fetch(`/api/admin/articles/${id}?permanent=1`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Article supprimé définitivement.')
      setDeleteTarget(null)
      load()
    } else toast.error('Erreur')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Articles</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total} article{total > 1 ? 's' : ''} {trashMode ? 'dans la corbeille' : 'dans la base'}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={trashMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTrashMode(!trashMode)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" /> Corbeille
          </Button>
          <Link
            href="/dashboard/articles/nouveau"
            className="inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
          >
            <FilePlus2 className="h-4 w-4" /> Nouvel article
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un article…"
            className="h-9 w-64 pl-8"
          />
        </div>
        {!trashMode && (
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-44"><Filter className="h-3.5 w-3.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="DRAFT">Brouillons</SelectItem>
              <SelectItem value="REVIEW">En relecture</SelectItem>
              <SelectItem value="SCHEDULED">Programmés</SelectItem>
              <SelectItem value="PUBLISHED">Publiés</SelectItem>
              <SelectItem value="ARCHIVED">Archivés</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
            <FileEdit className="h-8 w-8 opacity-40" />
            <p className="text-sm">{trashMode ? 'La corbeille est vide.' : 'Aucun article ne correspond à ces filtres.'}</p>
          </div>
        ) : (
          <div className="nice-scroll overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Titre</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Rubrique</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Vues</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-b border-border/50 transition-colors last:border-0 hover:bg-secondary/40">
                    <td className="max-w-[340px] px-4 py-3">
                      <Link href={`/dashboard/articles/${a.id}`} className="line-clamp-1 font-medium hover:text-[color:var(--brand)]">
                        {a.title}
                      </Link>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                        {FORMAT_LABELS[a.format] ?? a.format} · {a.author?.name} · {a._count.comments} comm.
                        {a.featured && <span className="ml-1.5 rounded bg-[color:var(--brand)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--brand)]">UNE</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[a.status]}`}>
                        {STATUS_LABELS[a.status] ?? a.status}
                      </span>
                      {a.status === 'SCHEDULED' && a.scheduledAt && (
                        <p className="mt-1 text-[11px] text-muted-foreground">→ {formatDateShortFr(a.scheduledAt)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a.categories.map((c) => (
                        <span key={c.category.name} className="mr-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium" style={{ background: (c.category.color || '#888') + '20', color: c.category.color || '#555' }}>
                          {c.category.name}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-muted-foreground">
                      {formatDateShortFr(a.publishedAt || a.scheduledAt || a.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] tabular-nums text-muted-foreground">{a.views.toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {trashMode ? (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => restore(a.id)} title="Restaurer" className="h-8 w-8">
                              <Undo2 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(a)} title="Supprimer définitivement" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Link href={`/article/${a.slug}`} target="_blank" title="Voir sur le site" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link href={`/dashboard/articles/${a.id}`} title="Modifier" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                              <FileEdit className="h-4 w-4" />
                            </Link>
                            <button onClick={() => duplicate(a.id)} title="Dupliquer" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                              <Copy className="h-4 w-4" />
                            </button>
                            <button onClick={() => trash(a.id)} title="Mettre à la corbeille" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Archive className="h-3.5 w-3.5" /> Les articles mis à la corbeille restent restaurables pendant 30 jours.
      </p>

      {/* Confirmation de suppression définitive */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {deleteTarget?.title} » sera supprimé définitivement. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteForever(deleteTarget.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
