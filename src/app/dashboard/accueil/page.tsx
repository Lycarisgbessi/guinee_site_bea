'use client'

import { useCallback, useEffect, useState } from 'react'
import { Reorder } from 'framer-motion'
import { Check, ChevronUp, Loader2, Settings2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Block {
  id: string
  blockType: string
  order: number
  active: boolean
  configJson: string
}

const BLOCK_LABELS: Record<string, string> = {
  HERO_UNE: 'Une du jour (grande une + secondaires)',
  FIL_ACTU: 'Fil d’actualité (derniers articles)',
  REPORTAGES_PHARES: 'Reportages phares (grands visuels)',
  RUBRIQUE_STRIP: 'Bandeau de rubrique (3 articles)',
  CITATION: 'Citation éditoriale',
  NEWSLETTER: 'Encart newsletter',
}

const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand'

/** Configuration des blocs de la page d’accueil (§6.5) */
export default function HomepageConfigPage() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/homepage-config')
    const data = await res.json()
    if (res.ok) setBlocks(data.blocks)
    else toast.error(data.error)
    const catRes = await fetch('/api/categories')
    const catData = await catRes.json()
    if (catRes.ok) setCategories(catData.categories)
    setLoading(false)
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(load)
    return () => cancelAnimationFrame(raf)
  }, [load])

  async function persist(newBlocks: Block[]) {
    setBlocks(newBlocks)
    setSaving(true)
    const res = await fetch('/api/admin/homepage-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: newBlocks.map((b, i) => ({ id: b.id, order: i, active: b.active, configJson: JSON.parse(b.configJson || '{}') })),
      }),
    })
    setSaving(false)
    if (!res.ok) toast.error('Erreur lors de l’enregistrement')
  }

  function toggleActive(block: Block) {
    const updated = blocks.map((b) => (b.id === block.id ? { ...b, active: !b.active } : b))
    persist(updated)
  }

  function updateConfig(block: Block, patch: Record<string, unknown>) {
    const config = { ...JSON.parse(block.configJson || '{}'), ...patch }
    const updated = blocks.map((b) => (b.id === block.id ? { ...b, configJson: JSON.stringify(config) } : b))
    persist(updated)
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Page d’accueil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ordonnez et configurez les blocs par glisser-déposer. Les changements sont visibles immédiatement sur le site.
        </p>
        {saving && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[color:var(--brand)]">
            <Loader2 className="h-3 w-3 animate-spin" /> Enregistrement…
          </p>
        )}
      </div>

      <Reorder.Group as="ol" axis="y" values={blocks} onReorder={persist} className="space-y-3">
        {blocks.map((block) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const config: any = JSON.parse(block.configJson || '{}')
          return (
            <Reorder.Item
              key={block.id}
              value={block}
              className={`rounded-lg border bg-card p-4 transition-opacity ${block.active ? 'border-border' : 'border-dashed border-border opacity-65'}`}
            >
              <div className="flex items-center gap-3">
                <ChevronUp className="h-4 w-4 cursor-grab rotate-180 text-muted-foreground active:cursor-grabbing" aria-hidden="true" />
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-[11px] font-bold text-muted-foreground">
                  {blocks.indexOf(block) + 1}
                </span>
                <div className="flex-1">
                  <p className="text-[14.5px] font-semibold">{BLOCK_LABELS[block.blockType] ?? block.blockType}</p>
                </div>
                <Switch checked={block.active} onCheckedChange={() => toggleActive(block)} aria-label="Activer le bloc" />
              </div>

              {/* Configurations spécifiques */}
              {block.active && block.blockType === 'HERO_UNE' && (
                <div className="mt-3 flex items-center gap-3 rounded-md bg-secondary/50 p-3">
                  <label className="text-[12.5px] text-muted-foreground">Articles secondaires affichés :</label>
                  <Select value={String(config.secondaryCount ?? 4)} onValueChange={(v) => updateConfig(block, { secondaryCount: parseInt(v, 10) })}>
                    <SelectTrigger className="h-8 w-16"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-[11.5px] text-muted-foreground">La grande une se choisit via le bouton « À la une » dans chaque article.</p>
                </div>
              )}

              {block.active && block.blockType === 'FIL_ACTU' && (
                <div className="mt-3 grid gap-3 rounded-md bg-secondary/50 p-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[12px] text-muted-foreground">Titre du bloc</label>
                    <input
                      value={config.title ?? 'L’actualité du moment'}
                      onChange={(e) => updateConfig(block, { title: e.target.value })}
                      className={`${inputCls} h-8`}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-[12.5px] text-muted-foreground">Nombre d’articles :</label>
                    <Select value={String(config.count ?? 6)} onValueChange={(v) => updateConfig(block, { count: parseInt(v, 10) })}>
                      <SelectTrigger className="h-8 w-16"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[4, 6, 8, 10].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {block.active && block.blockType === 'REPORTAGES_PHARES' && (
                <div className="mt-3 flex items-center gap-3 rounded-md bg-secondary/50 p-3">
                  <label className="text-[12.5px] text-muted-foreground">Titre du bloc :</label>
                  <input
                    value={config.title ?? 'Reportages phares'}
                    onChange={(e) => updateConfig(block, { title: e.target.value })}
                    className={`${inputCls} h-8 flex-1`}
                  />
                </div>
              )}

              {block.active && block.blockType === 'RUBRIQUE_STRIP' && (
                <div className="mt-3 grid gap-3 rounded-md bg-secondary/50 p-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[12px] text-muted-foreground">Rubrique affichée</label>
                    <Select value={config.categorySlug ?? ''} onValueChange={(v) => updateConfig(block, { categorySlug: v })}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Choisir une rubrique" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] text-muted-foreground">Titre du bandeau</label>
                    <input
                      value={config.title ?? ''}
                      onChange={(e) => updateConfig(block, { title: e.target.value })}
                      className={`${inputCls} h-8`}
                      placeholder="Ex. Derniers reportages"
                    />
                  </div>
                </div>
              )}

              {block.active && (block.blockType === 'CITATION' || block.blockType === 'NEWSLETTER') && (
                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  {block.blockType === 'CITATION' ? (
                    <><Check className="h-3.5 w-3.5" /> Affiche le chapô du dernier article publié, avec un lien vers celui-ci.</>
                  ) : (
                    <><Settings2 className="h-3.5 w-3.5" /> Le texte d’introduction se règle dans Paramètres → Newsletter.</>
                  )}
                  <X className="hidden" />
                </p>
              )}
            </Reorder.Item>
          )
        })}
      </Reorder.Group>
    </div>
  )
}
