'use client'

import { useCallback, useEffect, useState } from 'react'
import { ImagePlus, Link2, Loader2, Pencil, Search, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface MediaRow {
  id: string
  url: string
  filename: string
  type: string
  size: number | null
  alt: string | null
  caption: string | null
  credit: string | null
  createdAt: string
  uploadedBy?: { name?: string } | null
}

const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand'

/** Médiathèque centrale : upload, URL externe, métadonnées (§6.6) */
export default function MediaPage() {
  const [items, setItems] = useState<MediaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [uploading, setUploading] = useState(false)
  const [urlDialog, setUrlDialog] = useState(false)
  const [externalUrl, setExternalUrl] = useState('')
  const [editing, setEditing] = useState<MediaRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (typeFilter !== 'ALL') params.set('type', typeFilter)
    const res = await fetch(`/api/admin/media?${params}`)
    const data = await res.json()
    if (res.ok) setItems(data.items)
    else toast.error(data.error)
    setLoading(false)
  }, [q, typeFilter])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/media/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) toast.error(`${file.name} : ${data.error}`)
    }
    setUploading(false)
    toast.success('Upload terminé.')
    load()
  }

  async function addExternal() {
    const res = await fetch('/api/admin/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: externalUrl.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('Média ajouté à la médiathèque.')
      setUrlDialog(false)
      setExternalUrl('')
      load()
    } else toast.error(data.error)
  }

  async function saveEdit() {
    if (!editing) return
    const res = await fetch(`/api/admin/media/${editing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: editing.filename, alt: editing.alt, caption: editing.caption, credit: editing.credit }),
    })
    if (res.ok) {
      toast.success('Métadonnées enregistrées.')
      setEditing(null)
      load()
    } else toast.error('Erreur')
  }

  async function remove(m: MediaRow) {
    if (!window.confirm(`Supprimer « ${m.filename} » de la médiathèque ?`)) return
    const res = await fetch(`/api/admin/media/${m.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Média supprimé.')
      load()
    } else toast.error('Erreur')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Médiathèque</h1>
          <p className="mt-1 text-sm text-muted-foreground">Images, vidéos et documents, avec légendes et crédits.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md px-4 text-sm font-semibold transition-opacity hover:opacity-90" style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Uploader
            <input type="file" multiple accept="image/*,video/*,.pdf,audio/*" className="hidden" onChange={(e) => upload(e.target.files)} />
          </label>
          <Button variant="outline" onClick={() => setUrlDialog(true)} className="gap-2">
            <Link2 className="h-4 w-4" /> Ajouter par URL
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="h-9 w-60 pl-8" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les types</SelectItem>
            <SelectItem value="IMAGE">Images</SelectItem>
            <SelectItem value="VIDEO">Vidéos</SelectItem>
            <SelectItem value="PDF">PDF</SelectItem>
            <SelectItem value="AUDIO">Audio</SelectItem>
            <SelectItem value="DOC">Documents</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{items.length} média{items.length > 1 ? 's' : ''}</span>
      </div>

      {/* Grille */}
      {loading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImagePlus className="h-8 w-8 opacity-40" />
          <p className="text-sm">Aucun média. Uploadez un fichier ou ajoutez une URL.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((m) => (
            <div key={m.id} className="group overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
              <div className="relative">
                {m.type === 'IMAGE' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.alt || ''} loading="lazy" className="h-32 w-full object-cover" />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-secondary font-display text-sm font-bold text-muted-foreground">
                    {m.type}
                  </div>
                )}
                <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => setEditing(m)}
                    title="Modifier les métadonnées"
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-background/90 text-foreground shadow hover:text-brand"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(m)}
                    title="Supprimer"
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-background/90 text-foreground shadow hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-2">
                <p className="truncate text-[12px] font-medium" title={m.filename}>{m.filename}</p>
                <p className="truncate text-[11px] text-muted-foreground">{m.alt || m.caption || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog URL externe */}
      <Dialog open={urlDialog} onOpenChange={setUrlDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">Ajouter un média par URL</DialogTitle></DialogHeader>
          <input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} className={inputCls} placeholder="https://exemple.fr/image.jpg" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setUrlDialog(false)}>Annuler</Button>
            <Button onClick={addExternal} className="text-white" style={{ background: 'var(--brand)' }}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog édition métadonnées */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Métadonnées du média</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              {editing.type === 'IMAGE' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editing.url} alt="" className="max-h-44 w-full rounded-md object-cover" />
              )}
              <div>
                <label className="mb-1 block text-[12.5px] font-medium">Nom du fichier</label>
                <input value={editing.filename} onChange={(e) => setEditing({ ...editing, filename: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-[12.5px] font-medium">Texte alternatif (accessibilité)</label>
                <input value={editing.alt ?? ''} onChange={(e) => setEditing({ ...editing, alt: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-[12.5px] font-medium">Légende</label>
                <input value={editing.caption ?? ''} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-[12.5px] font-medium">Crédit photo</label>
                <input value={editing.credit ?? ''} onChange={(e) => setEditing({ ...editing, credit: e.target.value })} className={inputCls} />
              </div>
              <p className="text-[11px] text-muted-foreground">URL : <code className="break-all rounded bg-secondary px-1.5 py-0.5">{editing.url}</code></p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={saveEdit} className="text-white" style={{ background: 'var(--brand)' }}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
