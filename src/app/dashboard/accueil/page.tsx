'use client'

import { useCallback, useEffect, useState } from 'react'
import { Reorder } from 'framer-motion'
import { ChevronUp, Loader2, Plus, Settings2, Trash2 } from 'lucide-react'
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

/** Configuration des blocs de la page d’accueil (§6.5) — contenu, ordre, activation, ajout/suppression */
export default function HomepageConfigPage() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([])
  const [articles, setArticles] = useState<{ slug: string; title: string }[]>([])
  const [addType, setAddType] = useState<string>('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/homepage-config')
    const data = await res.json()
    if (res.ok) setBlocks(data.blocks)
    else toast.error(data.error)
    const catRes = await fetch('/api/categories')
    const catData = await catRes.json()
    if (catRes.ok) setCategories(catData.categories)
    const artRes = await fetch('/api/articles?perPage=50')
    const artData = await artRes.json()
    if (artRes.ok) setArticles(artData.items.map((a: { slug: string; title: string }) => ({ slug: a.slug, title: a.title })))
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

  async function addBlock() {
    if (!addType) {
      toast.error('Choisissez d’abord un type de bloc.')
      return
    }
    setAdding(true)
    const res = await fetch('/api/admin/homepage-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockType: addType }),
    })
    const data = await res.json()
    setAdding(false)
    if (res.ok) {
      toast.success('Bloc ajouté en fin de page.')
      setAddType('')
      load()
    } else toast.error(data.error)
  }

  async function removeBlock(block: Block) {
    if (!window.confirm(`Retirer le bloc « ${BLOCK_LABELS[block.blockType] ?? block.blockType} » de l’accueil ? Vous pourrez le ré-ajouter ensuite.`)) return
    const res = await fetch(`/api/admin/homepage-config?id=${block.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      toast.success('Bloc retiré.')
      setBlocks(data.blocks)
    } else toast.error(data.error)
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
          Ordonnez, configurez, ajoutez ou retirez les blocs. Les changements sont visibles immédiatement sur le site.
        </p>
        {saving && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[color:var(--brand)]">
            <Loader2 className="h-3 w-3 animate-spin" /> Enregistrement…
          </p>
        )}
      </div>

      <Reorder.Group as="ol" axis="y" values={blocks} onReorder={persist} className="space-y-3">
        {blocks.map((block) => {
           
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
                <button
                  onClick={() => removeBlock(block)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Retirer le bloc ${block.blockType}`}
                  title="Retirer ce bloc de l’accueil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <Switch checked={block.active} onCheckedChange={() => toggleActive(block)} aria-label="Activer le bloc" />
              </div>

              {/* Configurations spécifiques */}
              {block.active && block.blockType === 'HERO_UNE' && (
                <div className="mt-3 grid gap-3 rounded-md bg-secondary/50 p-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[12px] text-muted-foreground">Badge affiché sur la grande une</label>
                    <input
                      value={config.heroLabel ?? 'À la une'}
                      onChange={(e) => updateConfig(block, { heroLabel: e.target.value })}
                      className={`${inputCls} h-8`}
                      placeholder="À la une"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-[12.5px] text-muted-foreground">Articles secondaires :</label>
                    <Select value={String(config.secondaryCount ?? 4)} onValueChange={(v) => updateConfig(block, { secondaryCount: parseInt(v, 10) })}>
                      <SelectTrigger className="h-8 w-16"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <p className="text-[11.5px] text-muted-foreground">La grande une se choisit via « À la une » dans chaque article.</p>
                  </div>
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
                <div className="mt-3 grid gap-3 rounded-md bg-secondary/50 p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <div>
                    <label className="mb-1 block text-[12px] text-muted-foreground">Sur-titre (petite ligne au-dessus)</label>
                    <input
                      value={config.eyebrow ?? 'Formats longs'}
                      onChange={(e) => updateConfig(block, { eyebrow: e.target.value })}
                      className={`${inputCls} h-8`}
                      placeholder="Formats longs"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] text-muted-foreground">Titre du bloc</label>
                    <input
                      value={config.title ?? 'Reportages phares'}
                      onChange={(e) => updateConfig(block, { title: e.target.value })}
                      className={`${inputCls} h-8`}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-[12.5px] text-muted-foreground">Nombre :</label>
                    <Select value={String(config.count ?? 3)} onValueChange={(v) => updateConfig(block, { count: parseInt(v, 10) })}>
                      <SelectTrigger className="h-8 w-16"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 6].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
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

              {block.active && block.blockType === 'CITATION' && (
                <div className="mt-3 grid gap-3 rounded-md bg-secondary/50 p-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[12px] text-muted-foreground">
                      Citation personnalisée — laissez vide pour afficher automatiquement le chapô du dernier article
                    </label>
                    <textarea
                      value={config.quoteText ?? ''}
                      onChange={(e) => updateConfig(block, { quoteText: e.target.value })}
                      rows={2}
                      className={`${inputCls} resize-y`}
                      placeholder="Ex. Le journalisme de terrain n’a jamais été aussi nécessaire qu’aujourd’hui."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] text-muted-foreground">Auteur de la citation (optionnel)</label>
                    <input
                      value={config.quoteAuthor ?? ''}
                      onChange={(e) => updateConfig(block, { quoteAuthor: e.target.value })}
                      className={`${inputCls} h-8`}
                      placeholder="Ex. Albert Londres"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] text-muted-foreground">Article lié (affiché sous la citation)</label>
                    <Select
                      value={config.quoteArticleSlug ?? 'auto'}
                      onValueChange={(v) => updateConfig(block, { quoteArticleSlug: v === 'auto' ? '' : v })}
                    >
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automatique (dernier publié)</SelectItem>
                        {articles.map((a) => (
                          <SelectItem key={a.slug} value={a.slug}>{a.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[12px] text-muted-foreground">Libellé du lien (optionnel — par défaut le titre de l’article)</label>
                    <input
                      value={config.quoteLinkLabel ?? ''}
                      onChange={(e) => updateConfig(block, { quoteLinkLabel: e.target.value })}
                      className={`${inputCls} h-8`}
                      placeholder="Ex. Lire le reportage complet"
                    />
                  </div>
                </div>
              )}

              {block.active && block.blockType === 'NEWSLETTER' && (
                <div className="mt-3 grid gap-3 rounded-md bg-secondary/50 p-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[12px] text-muted-foreground">Sur-titre</label>
                    <input
                      value={config.eyebrow ?? 'Newsletter'}
                      onChange={(e) => updateConfig(block, { eyebrow: e.target.value })}
                      className={`${inputCls} h-8`}
                      placeholder="Newsletter"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] text-muted-foreground">Titre de l’encart</label>
                    <input
                      value={config.title ?? 'Ne manquez rien de nos enquêtes'}
                      onChange={(e) => updateConfig(block, { title: e.target.value })}
                      className={`${inputCls} h-8`}
                      placeholder="Ne manquez rien de nos enquêtes"
                    />
                  </div>
                  <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground sm:col-span-2">
                    <Settings2 className="h-3.5 w-3.5" /> Le texte d’introduction se règle dans Paramètres → Newsletter.
                  </p>
                </div>
              )}
            </Reorder.Item>
          )
        })}
      </Reorder.Group>

      {/* Ajout d'un bloc */}
      <div className="rounded-lg border border-dashed border-border bg-card/60 p-4">
        <label className="mb-1.5 block text-[13px] font-medium">Ajouter un bloc à l’accueil</label>
        <div className="flex flex-wrap gap-2">
          <Select value={addType} onValueChange={setAddType}>
            <SelectTrigger className="h-10 w-full sm:w-80"><SelectValue placeholder="Choisir un type de bloc" /></SelectTrigger>
            <SelectContent>
              {Object.entries(BLOCK_LABELS).map(([type, label]) => (
                <SelectItem key={type} value={type}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={addBlock}
            disabled={adding}
            className="inline-flex h-10 items-center gap-1.5 rounded-md px-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Ajouter le bloc
          </button>
        </div>
        <p className="mt-1.5 text-[11.5px] text-muted-foreground">
          Un même type de bloc peut être utilisé plusieurs fois (ex. deux bandeaux de rubriques différents).
        </p>
      </div>
    </div>
  )
}
