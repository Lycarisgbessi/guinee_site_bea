'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExt from '@tiptap/extension-link'
import ImageExt from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import UnderlineExt from '@tiptap/extension-underline'
import HighlightExt from '@tiptap/extension-highlight'
import type { Editor } from '@tiptap/react'
import {
  Bold, Italic, Underline, Strikethrough, Highlighter, Heading2, Heading3, List, ListOrdered, Quote, Minus,
  Link2, ImagePlus, Youtube as YoutubeIcon, Undo2, Redo2, Trash2,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { MediaPicker } from './media-picker'
import { uploadFile } from '@/lib/upload-client'

// Image étendue avec légende + crédit (§5.5)
const ImageWithCaption = ImageExt.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: { default: null },
      credit: { default: null },
      alt: { default: null },
    }
  },
})

interface RichEditorProps {
  value: object | null
  onChange: (json: object) => void
}

/** Upload + insertion d'un fichier image collé ou déposé dans l'éditeur */
async function uploadAndInsert(editor: Editor, files: File[]) {
  const images = files.filter((f) => f.type.startsWith('image/'))
  if (images.length === 0) return false
  for (const file of images) {
    toast.promise(uploadFile(file), {
      loading: `Import de « ${file.name} »…`,
      success: (media) => {
        editor
          .chain()
          .focus()
          .setImage({ src: media.url, alt: media.alt || '', caption: '', credit: '' } as unknown as { src: string })
          .run()
        return `« ${file.name} » insérée.`
      },
      error: (e) => (e instanceof Error ? e.message : "Échec de l'import"),
    })
  }
  return true
}

const btnCls =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground data-[active=true]:bg-[color:var(--brand)]/10 data-[active=true]:text-[color:var(--brand)]'

/** Éditeur WYSIWYG headless (Tiptap) — blocs texte, images, citations, vidéos (§6.4) */
export function RichEditor({ value, onChange }: RichEditorProps) {
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [mediaOpen, setMediaOpen] = useState(false)
  const [ytOpen, setYtOpen] = useState(false)
  const [ytUrl, setYtUrl] = useState('')
  // Réf pour accéder à l'éditeur depuis les handlers de collage/dépôt (closure du 1er rendu)
  const editorRef = useRef<Editor | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      ImageWithCaption,
      Youtube.configure({ nocookie: true, controls: true }),
      UnderlineExt,
      HighlightExt,
      Placeholder.configure({ placeholder: 'Rédigez votre article ici… Le texte, les images et les vidéos se composent comme dans un traitement de texte.' }),
    ],
    content: value ?? { type: 'doc', content: [] },
    editorProps: {
      attributes: { class: 'prose-features min-h-[420px] px-4 py-3 focus:outline-none' },
      // Collage direct d'image (Ctrl+V) → import auto + insertion
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? [])
        const current = editorRef.current
        if (files.length === 0 || !current) return false
        const hasImage = files.some((f) => f.type.startsWith('image/'))
        if (!hasImage) return false
        event.preventDefault()
        void uploadAndInsert(current, files)
        return true
      },
      // Glisser-déposer d'image → import auto + insertion
      handleDrop: (_view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? [])
        const current = editorRef.current
        if (files.length === 0 || !current) return false
        const hasImage = files.some((f) => f.type.startsWith('image/'))
        if (!hasImage) return false
        event.preventDefault()
        void uploadAndInsert(current, files)
        return true
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getJSON())
    },
  })

  useEffect(() => {
    editorRef.current = editor ?? null
    return () => {
      editor?.destroy()
    }
  }, [editor])

  if (!editor) {
    return <div className="min-h-[420px] animate-pulse rounded-md bg-secondary" />
  }

  const insertImage = (url: string, alt: string, caption: string, credit: string) => {
    // L'extension ImageWithCaption ajoute caption/credit à l'exécution — le typage de base les ignore
    editor.chain().focus().setImage({ src: url, alt, caption, credit } as unknown as { src: string }).run()
  }

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-background">
      {/* Barre d’outils */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-secondary/40 px-2 py-1.5">
        <button
          type="button" aria-label="Gras" className={btnCls} data-active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button" aria-label="Italique" className={btnCls} data-active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button" aria-label="Souligné" className={btnCls} data-active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-4 w-4" />
        </button>
        <button
          type="button" aria-label="Barré" className={btnCls} data-active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <button
          type="button" aria-label="Surligné" className={btnCls} data-active={editor.isActive('highlight')}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button
          type="button" aria-label="Intertitre 2" className={btnCls} data-active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button" aria-label="Intertitre 3" className={btnCls} data-active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button
          type="button" aria-label="Liste à puces" className={btnCls} data-active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button" aria-label="Liste numérotée" className={btnCls} data-active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button" aria-label="Citation" className={btnCls} data-active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button" aria-label="Séparateur" className={btnCls}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button
          type="button" aria-label="Lien" className={btnCls} data-active={editor.isActive('link')}
          onClick={() => {
            const existing = editor.getAttributes('link').href as string | undefined
            setLinkUrl(existing ?? '')
            setLinkOpen(true)
          }}
        >
          <Link2 className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Image depuis la médiathèque" className={btnCls} onClick={() => setMediaOpen(true)}>
          <ImagePlus className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Vidéo YouTube" className={btnCls} onClick={() => setYtOpen(true)}>
          <YoutubeIcon className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" aria-label="Annuler" className={btnCls} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Rétablir" className={btnCls} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <EditorContent editor={editor} />

      {/* Dialog lien */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Insérer un lien</DialogTitle>
          </DialogHeader>
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://…"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-brand"
          />
          <div className="flex justify-end gap-2">
            {editor.isActive('link') && (
              <button
                type="button"
                className="rounded-md border border-border px-3 py-2 text-sm"
                onClick={() => {
                  editor.chain().focus().unsetLink().run()
                  setLinkOpen(false)
                }}
              >
                <Trash2 className="mr-1.5 inline h-3.5 w-3.5" /> Retirer
              </button>
            )}
            <button
              type="button"
              className="rounded-md px-4 py-2 text-sm font-semibold"
              style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
              onClick={() => {
                if (linkUrl.trim()) {
                  editor.chain().focus().setLink({ href: linkUrl.trim() }).run()
                }
                setLinkOpen(false)
              }}
            >
              Appliquer
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog YouTube */}
      <Dialog open={ytOpen} onOpenChange={setYtOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Intégrer une vidéo YouTube</DialogTitle>
          </DialogHeader>
          <input
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-brand"
          />
          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-md px-4 py-2 text-sm font-semibold"
              style={{ background: 'var(--brand)', color: 'var(--brand-foreground)' }}
              onClick={() => {
                if (ytUrl.trim()) {
                  editor.commands.setYoutubeVideo({ src: ytUrl.trim() })
                }
                setYtUrl('')
                setYtOpen(false)
              }}
            >
              Insérer
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Médiathèque */}
      <MediaPicker
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        onSelect={(media) => {
          insertImage(media.url, media.alt || '', media.caption || '', media.credit || '')
        }}
      />
    </div>
  )
}
