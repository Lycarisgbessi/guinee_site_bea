/**
 * Rendu serveur du contenu structuré Tiptap JSON (§7.2 contenu_json)
 * Supporte : paragraphes, intertitres, images avec légende/crédit, citations,
 * vidéos YouTube, listes, séparateurs, gras/italique/liens.
 */
import { Fragment } from 'react'

 
type Node = any

function nodeText(node: Node): string {
  if (!node) return ''
  if (node.type === 'text') return node.text ?? ''
  return (node.content ?? []).map(nodeText).join('')
}

/** Slug stable pour les ancres de sommaire (accents français inclus) */
function slugifyHeading(text: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return base || 'section'
}

export interface TocItem {
  id: string
  text: string
}

/**
 * Extrait les intertitres H2 pour le sommaire de l'article.
 * Utilise le même algorithme de dédoublonnage (ordre de parcours identique)
 * que renderNode → les ancres correspondent toujours.
 */
export function extractToc(doc: Node): TocItem[] {
  const seen = new Map<string, number>()
  const items: TocItem[] = []
  const walk = (node: Node) => {
    if (!node) return
    if (node.type === 'heading' && node.attrs?.level !== 3) {
      const text = nodeText(node).trim()
      if (!text) return
      const base = slugifyHeading(text)
      const n = (seen.get(base) ?? 0) + 1
      seen.set(base, n)
      items.push({ id: n === 1 ? base : `${base}-${n}`, text })
    }
    for (const child of node.content ?? []) walk(child)
  }
  walk(doc)
  return items
}

function renderMarks(node: Node, keyPrefix: string): React.ReactNode {
  if (node.type !== 'text') return null
  let content: React.ReactNode = node.text
  const marks: string[] = (node.marks ?? []).map((m: Node) => m.type)
  if (marks.includes('bold')) content = <strong key={`b-${keyPrefix}`}>{content}</strong>
  if (marks.includes('italic')) content = <em key={`i-${keyPrefix}`}>{content}</em>
  if (marks.includes('underline')) content = <u key={`u-${keyPrefix}`}>{content}</u>
  if (marks.includes('strike')) content = <s key={`s-${keyPrefix}`}>{content}</s>
  if (marks.includes('highlight'))
    content = (
      <mark
        key={`h-${keyPrefix}`}
        className="rounded-[3px] bg-[color:var(--brand)]/20 px-1 text-inherit [box-decoration-break:clone]"
      >
        {content}
      </mark>
    )
  if (marks.includes('code')) content = <code key={`c-${keyPrefix}`} className="rounded bg-secondary px-1.5 py-0.5 text-[0.9em]">{content}</code>
  const link = (node.marks ?? []).find((m: Node) => m.type === 'link')
  if (link) {
    content = (
      <a key={`a-${keyPrefix}`} href={link.attrs?.href} target={link.attrs?.target ?? '_blank'} rel="noopener noreferrer">
        {content}
      </a>
    )
  }
  return <Fragment key={keyPrefix}>{content}</Fragment>
}

/** H2 avec ancre de sommaire (dédoublonnage déterministe, même ordre que extractToc) */
function HeadingAnchor({
  Tag,
  node,
  keyPrefix,
  children,
}: {
   
  Tag: any
  node: Node
  keyPrefix: string
  children: React.ReactNode
}) {
  const text = nodeText(node).trim()
  const base = slugifyHeading(text)
  const n = (headingSeen.get(base) ?? 0) + 1
  headingSeen.set(base, n)
  const id = n === 1 ? base : `${base}-${n}`
  return (
    <Tag key={keyPrefix} id={id}>
      {children}
    </Tag>
  )
}

// Compteur par rendu (reset à chaque arbre rendu grâce au parcours racine unique)
const headingSeen = new Map<string, number>()

function renderNode(node: Node, key: string): React.ReactNode {
  if (!node) return null
  switch (node.type) {
    case 'doc':
      return <Fragment key={key}>{(node.content ?? []).map((c: Node, i: number) => renderNode(c, `${key}-${i}`))}</Fragment>
    case 'paragraph':
      return <p key={key}>{(node.content ?? []).map((c: Node, i: number) => renderMarks(c, `${key}-${i}`))}</p>
    case 'heading': {
      const level = node.attrs?.level === 3 ? 3 : 2
      const Tag = level === 2 ? 'h2' : 'h3'
      if (level === 2) {
        // Ancre pour le sommaire (même dédoublonnage que extractToc)
        return (
          <HeadingAnchor key={key} Tag={Tag} node={node} keyPrefix={key}>
            {(node.content ?? []).map((c: Node, i: number) => renderMarks(c, `${key}-${i}`))}
          </HeadingAnchor>
        )
      }
      return <Tag key={key}>{(node.content ?? []).map((c: Node, i: number) => renderMarks(c, `${key}-${i}`))}</Tag>
    }
    case 'blockquote':
      return (
        <blockquote key={key}>
          {(node.content ?? []).map((c: Node, i: number) => renderNode(c, `${key}-${i}`))}
        </blockquote>
      )
    case 'bulletList':
      return (
        <ul key={key}>
          {(node.content ?? []).map((c: Node, i: number) => renderNode(c, `${key}-${i}`))}
        </ul>
      )
    case 'orderedList':
      return (
        <ol key={key}>
          {(node.content ?? []).map((c: Node, i: number) => renderNode(c, `${key}-${i}`))}
        </ol>
      )
    case 'listItem':
      return <li key={key}>{(node.content ?? []).map((c: Node, i: number) => renderNode(c, `${key}-${i}`))}</li>
    case 'horizontalRule':
      return <hr key={key} />
    case 'image': {
      const src = node.attrs?.src
      if (!src) return null
      const caption = node.attrs?.caption
      const credit = node.attrs?.credit
      return (
        <figure key={key}>
          { }
          <img src={src} alt={node.attrs?.alt ?? ''} loading="lazy" className="w-full rounded-md" />
          {(caption || credit) && (
            <figcaption>
              {caption}
              {credit && <span className="block text-[11px] uppercase tracking-wide opacity-70">{credit}</span>}
            </figcaption>
          )}
        </figure>
      )
    }
    case 'youtube': // nom de nœud Tiptap v3 (l'ancien 'youTube' reste accepté)
    case 'youTube': {
      const url: string = node.attrs?.src ?? ''
      const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/)
      const vid = m ? m[1] : null
      if (!vid) return null
      return (
        <div key={key} className="my-6 aspect-video w-full overflow-hidden rounded-lg bg-black/90">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${vid}`}
            title="Vidéo YouTube"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )
    }
    default:
      // Nœud inconnu : rendu récursif de ses enfants
      if (Array.isArray(node.content)) {
        return <Fragment key={key}>{node.content.map((c: Node, i: number) => renderNode(c, `${key}-${i}`))}</Fragment>
      }
      return null
  }
}

export function RichContent({ doc, dropcap = false }: { doc: Node; dropcap?: boolean }) {
  if (!doc) return null
  headingSeen.clear()
  return (
    <div className={`rt-content article-body ${dropcap ? '[&>p:first-of-type]:dropcap' : ''}`}>
      {renderNode(doc, 'root')}
    </div>
  )
}
