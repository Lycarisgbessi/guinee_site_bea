'use client'

import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, FileText, FolderPlus, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RichEditor } from '@/components/dashboard/rich-editor'
import { MediaPicker } from '@/components/dashboard/media-picker'

interface PageRow {
  id: string
  slug: string
  title: string
  contentJson: string
  heroImage: string | null
  seoTitle: string | null
  seoDescription: string | null
  published: boolean
  system: boolean
}

const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand'

/** Gestion des pages statiques (§6.5) */
export default function PagesPage() {
  const [pages, setPages] = useState<PageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<PageRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/pages')
    const data = await res.json()
    if (res.ok) setPages(data.pages)
    else toast.error(data.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(load)
    return () => cancelAnimationFrame(raf)
  }, [load])

  async function openEdit(p: PageRow) {
    setEditing(p)
  }

  async function saveEdit() {
    if (!editing) return
    setSaving(true)
    const res = await fetch(`/api/admin/pages/${editing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editing.title,
        contentJson: editing.contentJson ? JSON.parse(editing.contentJson) : null,
        heroImage: editing.heroImage,
        seoTitle: editing.seoTitle,
        seoDescription: editing.seoDescription,
        published: editing.published,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      toast.success('Page enregistrée.')
      setEditing(null)
      load()
    } else toast.error(data.error)
  }

  async function togglePublished(p: PageRow) {
    const res = await fetch(`/api/admin/pages/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !p.published }),
    })
    if (res.ok) {
      toast.success(!p.published ? 'Page publiée.' : 'Page dépubliée.')
      load()
    }
  }

  async function remove(p: PageRow) {
    if (!window.confirm(`Supprimer la page « ${p.title} » ?`)) return
    const res = await fetch(`/api/admin/pages/${p.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      toast.success('Page supprimée.')
      load()
    } else toast.error(data.error)
  }

  async function createPage() {
    if (newTitle.trim().length < 2) {
      toast.error('Titre requis.')
      return
    }
    const res = await fetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), contentJson: { type: 'doc', content: [] } }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('Page créée.')
      setCreating(false)
      setNewTitle('')
      load()
      setEditing(data.page)
    } else toast.error(data.error)
  }

   
  const [editDoc, setEditDoc] = useState<any>(null)

  function openEditor(p: PageRow) {
    setEditDoc(p.contentJson ? JSON.parse(p.contentJson) : { type: 'doc', content: [] })
    openEdit(p)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Pages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pages statiques éditables : À propos, mentions légales, pages libres… 100 % pilotables en blocs.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2 text-white" style={{ background: 'var(--brand)' }}>
          <Plus className="h-4 w-4" /> Nouvelle page
        </Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ul className="space-y-2.5">
          {pages.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {p.title}
                  {p.system && <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">système</span>}
                  {!p.published && <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-400">dépubliée</span>}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {p.slug === 'a-propos' ? '/a-propos' : `/p/${p.slug}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <a
                  href={p.slug === 'a-propos' ? '/a-propos' : `/p/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Voir en ligne"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditor(p)} title="Modifier">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => remove(p)}
                  title={p.system ? 'Page système non supprimable' : 'Supprimer'}
                  disabled={p.system}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Dialog édition */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">Modifier « {editing?.title} »</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={`${inputCls} font-semibold`} placeholder="Titre de la page" />
              <div className="flex items-center gap-2">
                {editing.heroImage ? (
                  <>
                    { }
                    <img src={editing.heroImage} alt="" className="h-14 w-24 rounded-md object-cover" />
                    <button onClick={() => setEditing({ ...editing, heroImage: '' })} className="text-xs text-destructive hover:underline">
                      Retirer
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setPickerOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-brand hover:text-brand"
                  >
                    <FolderPlus className="h-3.5 w-3.5" /> Ajouter une image de hero
                  </button>
                )}
              </div>
              <RichEditor value={editDoc} onChange={(json) => setEditDoc(json)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={editing.seoTitle ?? ''}
                  onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })}
                  className={inputCls}
                  placeholder="Meta-titre SEO"
                />
                <input
                  value={editing.seoDescription ?? ''}
                  onChange={(e) => setEditing({ ...editing, seoDescription: e.target.value })}
                  className={inputCls}
                  placeholder="Meta-description SEO"
                />
              </div>
              <label className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[color:var(--brand)]"
                  checked={editing.published}
                  onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                />
                Page publiée (visible sur le site)
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={saveEdit} disabled={saving} className="gap-2 text-white" style={{ background: 'var(--brand)' }}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog création */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Nouvelle page</DialogTitle>
          </DialogHeader>
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className={inputCls} placeholder="Titre de la page" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Annuler</Button>
            <Button onClick={createPage} className="text-white" style={{ background: 'var(--brand)' }}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaPicker open={pickerOpen} onOpenChange={setPickerOpen} onSelect={(m) => editing && setEditing({ ...editing, heroImage: m.url })} />
    </div>
  )
}
