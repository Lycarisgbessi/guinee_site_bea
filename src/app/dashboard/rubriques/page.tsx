'use client'

import { useCallback, useEffect, useState } from 'react'
import { Reorder } from 'framer-motion'
import { Eye, EyeOff, FolderPlus, GripVertical, Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { CATEGORY_COLORS } from '@/lib/shared'

interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  coverImage: string | null
  color: string | null
  order: number
  visible: boolean
  _count: { articles: number }
}

const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand'

export default function CategoriesPage() {
  const [items, setItems] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '', color: CATEGORY_COLORS[0], coverImage: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/categories')
    const data = await res.json()
    if (res.ok) setItems(data.categories)
    else toast.error(data.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(load)
    return () => cancelAnimationFrame(raf)
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', slug: '', description: '', color: CATEGORY_COLORS[0], coverImage: '' })
    setDialogOpen(true)
  }

  function openEdit(c: CategoryRow) {
    setEditing(c)
    setForm({ name: c.name, slug: c.slug, description: c.description || '', color: c.color || CATEGORY_COLORS[0], coverImage: c.coverImage || '' })
    setDialogOpen(true)
  }

  async function save() {
    if (form.name.trim().length < 2) {
      toast.error('Le nom est requis (2 caractères minimum).')
      return
    }
    setSaving(true)
    const res = await fetch(editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      toast.success(editing ? 'Rubrique mise à jour.' : 'Rubrique créée.')
      setDialogOpen(false)
      load()
    } else toast.error(data.error)
  }

  async function toggleVisibility(c: CategoryRow) {
    const res = await fetch(`/api/admin/categories/${c.id}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !c.visible }),
    })
    if (res.ok) {
      toast.success(!c.visible ? 'Rubrique affichée sur le site.' : 'Rubrique masquée (les articles restent en base).')
      load()
    } else toast.error('Erreur')
  }

  async function remove(c: CategoryRow) {
    if (!window.confirm(`Supprimer la rubrique « ${c.name} » ? Les ${c._count.articles} article(s) associés seront conservés.`)) return
    const res = await fetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Rubrique supprimée.')
      load()
    } else toast.error('Erreur')
  }

  async function persistOrder(newOrder: CategoryRow[]) {
    setItems(newOrder)
    const res = await fetch('/api/admin/categories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: newOrder.map((c) => c.id) }),
    })
    if (res.ok) toast.success('Ordre des rubriques mis à jour (menu du site).')
    else toast.error('Erreur lors de l’enregistrement de l’ordre')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Rubriques</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Glissez-déposez pour réorganiser le menu. Masquez une rubrique sans supprimer ses articles.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 text-white" style={{ background: 'var(--brand)' }}>
          <FolderPlus className="h-4 w-4" /> Nouvelle rubrique
        </Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Reorder.Group as="ul" axis="y" values={items} onReorder={persistOrder} className="space-y-2.5">
          {items.map((c) => (
            <Reorder.Item
              key={c.id}
              value={c}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <span className="cursor-grab text-muted-foreground active:cursor-grabbing" aria-hidden="true">
                <GripVertical className="h-5 w-5" />
              </span>
              <span className="h-9 w-9 shrink-0 rounded-md" style={{ background: c.color || '#888' }} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {c.name}
                  {!c.visible && <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">masquée</span>}
                </p>
                <p className="truncate text-[12px] text-muted-foreground">
                  /rubrique/{c.slug} · {c._count.articles} article{c._count.articles > 1 ? 's' : ''}
                  {c.description ? ` · ${c.description}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Switch checked={c.visible} onCheckedChange={() => toggleVisibility(c)} aria-label="Visibilité" />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)} title="Modifier">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(c)} title="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Eye className="h-3.5 w-3.5" /> Une rubrique masquée disparaît du site public, ses articles restent en base (§6.3).
        <EyeOff className="ml-2 h-3.5 w-3.5 opacity-0" aria-hidden="true" />
      </p>

      {/* Dialog création/édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? 'Modifier la rubrique' : 'Nouvelle rubrique'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <div>
              <label className="mb-1 block text-[13px] font-medium">Nom *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Ex. Environnement" />
            </div>
            {!editing && (
              <div>
                <label className="mb-1 block text-[13px] font-medium">Slug (URL)</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputCls} placeholder="environnement (auto si vide)" />
              </div>
            )}
            <div>
              <label className="mb-1 block text-[13px] font-medium">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={`${inputCls} resize-y`} />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Couleur thématique</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Couleur ${color}`}
                    onClick={() => setForm({ ...form, color })}
                    className={`h-8 w-8 rounded-md transition-transform hover:scale-110 ${form.color === color ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''}`}
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium">Image de couverture (URL)</label>
              <input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} className={inputCls} placeholder="https://… ou /uploads/…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={save} disabled={saving} className="gap-2 text-white" style={{ background: 'var(--brand)' }}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
