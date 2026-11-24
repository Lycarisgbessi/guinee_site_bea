'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Search, UploadCloud } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { uploadFile } from '@/lib/upload-client'

export interface MediaItem {
  id: string
  url: string
  filename: string
  type: string
  alt: string | null
  caption: string | null
  credit: string | null
}

/** Sélecteur de médias réutilisable avec import direct (glisser-déposer) */
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
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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

  async function handleFiles(files: FileList | File[] | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    const uploaded: MediaItem[] = []
    try {
      for (const file of Array.from(files)) {
        const media = await uploadFile(file)
        uploaded.push({ id: media.id, url: media.url, filename: media.filename, type: media.type, alt: media.alt, caption: null, credit: null })
      }
      setItems((prev) => [...uploaded, ...prev])
      if (uploaded.length === 1) {
        toast.success(`« ${uploaded[0].filename} » importé.`)
        onSelect(uploaded[0])
        onOpenChange(false)
      } else {
        toast.success(`${uploaded.length} médias importés — sélectionnez celui souhaité.`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'import")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const filtered = items
    .filter((m) => (imageOnly ? m.type === 'IMAGE' : true))
    .filter((m) => !q.trim() || m.filename.toLowerCase().includes(q.toLowerCase()) || (m.alt || '').toLowerCase().includes(q.toLowerCase()))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Importer / choisir un média</DialogTitle>
        </DialogHeader>

        {/* Zone d'import direct — glisser-déposer ou clic */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Importer des fichiers"
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && !uploading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (!uploading) handleFiles(e.dataTransfer.files)
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-5 text-center transition-colors ${
            dragOver ? 'border-[color:var(--brand)] bg-[color:var(--brand)]/5' : 'border-border hover:border-brand hover:text-brand'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-[color:var(--brand)]" />
              <p className="text-sm font-medium">Envoi en cours… (compression automatique)</p>
            </>
          ) : (
            <>
              <UploadCloud className="h-6 w-6" />
              <p className="text-sm font-medium">
                Glissez vos images ici <span className="font-normal text-muted-foreground">ou cliquez pour parcourir</span>
              </p>
              <p className="text-[11px] text-muted-foreground">JPG, PNG, WebP, GIF · 15 Mo max · optimisation automatique</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,audio/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans la médiathèque…" className="h-9 pl-8" />
        </div>
        <div className="nice-scroll grid max-h-[320px] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
          {loading ? (
            <div className="col-span-full flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImagePlus className="h-7 w-7 opacity-40" />
              <p className="text-xs">Aucun média. Importez un fichier ci-dessus.</p>
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
