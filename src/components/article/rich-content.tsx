/**
 * Rendu serveur du contenu structuré Tiptap JSON (§7.2 contenu_json)
 * Supporte : paragraphes, intertitres, images avec légende/crédit, citations,
 * vidéos YouTube, listes, séparateurs, gras/italique/liens.
 */
import { Fragment } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any

function renderMarks(node: Node, keyPrefix: string): React.ReactNode {
  if (node.type !== 'text') return null
  let content: React.ReactNode = node.text
  const marks: string[] = (node.marks ?? []).map((m: Node) => m.type)
  if (marks.includes('bold')) content = <strong key={`b-${keyPrefix}`}>{content}</strong>
  if (marks.includes('italic')) content = <em key={`i-${keyPrefix}`}>{content}</em>
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
    case 'youTube': {
      const url: string = node.attrs?.src ?? ''
      const m = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/)
      const vid = m ? m[1] : null
      if (!vid) return null
      return (
        <iframe
          key={key}
          src={`https://www.youtube-nocookie.com/embed/${vid}`}
          title="Vidéo YouTube"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
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
  return (
    <div className={`rt-content article-body ${dropcap ? '[&>p:first-of-type]:dropcap' : ''}`}>
      {renderNode(doc, 'root')}
    </div>
  )
}
