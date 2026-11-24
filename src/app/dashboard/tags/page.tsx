'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Hash, Loader2, Pencil, Plus, Tag as TagIcon, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

interface TagRow {
  id: string
  name: string
  slug: string
  _count?: { articles: number }
}

const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand'

/** Gestion des mots-clés : création, renommage, suppression (les articles restent intacts) */
export default function TagsPage() {
  const [tags, setTags] = useState<TagRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/tags')
    const data = await res.json()
    if (res.ok) setTags(data.tags)
    else toast.error(data.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(load)
    return () => cancelAnimationFrame(raf)
  }, [load])

  async function create() {
    if (newName.trim().length < 2) {
      toast.error('Nom du mot-clé trop court.')
      return
    }
    setBusy(true)
    const res = await fetch('/api/admin/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    const data = await res.json()
    setBusy(false)
    if (res.ok) {
      toast.success('Mot-clé prêt à être utilisé dans les articles.')
      setNewName('')
      load()
    } else toast.error(data.error)
  }

  async function rename(id: string) {
    if (editName.trim().length < 2) {
      toast.error('Nom du mot-clé trop court.')
      return
    }
    const res = await fetch('/api/admin/tags', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editName.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('Mot-clé renommé.')
      setEditingId(null)
      load()
    } else toast.error(data.error)
  }

  async function remove(t: TagRow) {
    const count = t._count?.articles ?? 0
    const confirmMsg =
      count > 0
        ? `Supprimer le mot-clé « ${t.name} » ? Il sera dissocié de ${count} article${count > 1 ? 's' : ''} (aucun article n'est supprimé).`
        : `Supprimer le mot-clé « ${t.name} » ?`
    if (!window.confirm(confirmMsg)) return
    const res = await fetch(`/api/admin/tags?id=${t.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      toast.success('Mot-clé supprimé.')
      load()
    } else toast.error(data.error)
  }

  if (loading) {
    return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Mots-clés</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Étiquettes transverses attachées aux articles — consultables publiquement sur /tags. Renommer un mot-clé met à jour son URL automatiquement.
        </p>
      </div>

      {/* Création */}
      <div className="rounded-lg border border-border bg-card p-4">
        <label className="mb-1.5 block text-[13px] font-medium">Nouveau mot-clé</label>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            className={inputCls}
            placeholder="Ex. Transition écologique"
          />
          <button
            onClick={create}
            disabled={busy}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md px-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Ajouter
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <TagIcon className="h-4 w-4 text-brand" /> {tags.length} mot-clé{tags.length > 1 ? 's' : ''}
          </p>
          <p className="text-[12px] text-muted-foreground">Utilisés dans les articles via l’éditeur</p>
        </div>
        <ul className="divide-y divide-border/40">
          {tags.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-5 py-3">
              <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              {editingId === t.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') rename(t.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    className={`${inputCls} h-8 max-w-xs`}
                    autoFocus
                  />
                  <button onClick={() => rename(t.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-emerald-600 hover:bg-secondary" aria-label="Valider">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary" aria-label="Annuler">
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{t.name}</p>
                    <p className="truncate text-[11.5px] text-muted-foreground">/tag/{t.slug}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {t._count?.articles ?? 0} article{(t._count?.articles ?? 0) > 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => {
                      setEditingId(t.id)
                      setEditName(t.name)
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    aria-label={`Renommer ${t.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(t)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Supprimer ${t.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </li>
          ))}
          {tags.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-muted-foreground">
              Aucun mot-clé pour le moment. Créez-en un ci-dessus, puis attachez-le aux articles dans l’éditeur.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
