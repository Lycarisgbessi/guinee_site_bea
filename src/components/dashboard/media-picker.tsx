'use client'

import { useCallback, useEffect, useState } from 'react'
import { ImagePlus, Loader2, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export interface MediaItem {
  id: string
  url: string
  filename: string
  type: string
  alt: string | null
  caption: string | null
  credit: string | null
}

/** Sélecteur de médias réutilisable (médiathèque, §6.6) */
export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  imageOnly = true,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (media: MediaItem) => void
  imageOnly?: boolean
}) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/media')
    const data = await res.json()
    if (res.ok) setItems(data.items)
    else toast.error('Impossible de charger la médiathèque')
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!open) return
    const raf = requestAnimationFrame(load)
    return () => cancelAnimationFrame(raf)
  }, [open, load])

  const filtered = items
    .filter((m) => (imageOnly ? m.type === 'IMAGE' : true))
    .filter((m) => !q.trim() || m.filename.toLowerCase().includes(q.toLowerCase()) || (m.alt || '').toLowerCase().includes(q.toLowerCase()))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Médiathèque</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un média…" className="h-9 pl-8" />
        </div>
        <div className="nice-scroll grid max-h-[380px] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
          {loading ? (
            <div className="col-span-full flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImagePlus className="h-7 w-7 opacity-40" />
              <p className="text-xs">Aucun média. Ajoutez-en depuis la médiathèque.</p>
            </div>
          ) : (
            filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onSelect(m)
                  onOpenChange(false)
                }}
                className="group overflow-hidden rounded-md border border-border transition-all hover:border-brand"
                title={m.alt || m.filename}
              >
                {m.type === 'IMAGE' ? (
                   
                  <img src={m.url} alt={m.alt || ''} className="h-20 w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="flex h-20 w-full items-center justify-center bg-secondary text-[11px] font-medium">{m.type}</div>
                )}
                <p className="truncate px-1.5 py-1 text-left text-[10px] text-muted-foreground">{m.filename}</p>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
