import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Pagination accessible (prev / next + numéros) */
export function Pagination({
  page,
  totalPages,
  basePath,
  extraParams = {},
}: {
  page: number
  totalPages: number
  basePath: string
  extraParams?: Record<string, string>
}) {
  if (totalPages <= 1) return null

  const href = (p: number) => {
    const params = new URLSearchParams({ ...extraParams })
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  )

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          aria-label="Page précédente"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border transition-colors hover:border-foreground/40"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border/40 text-muted-foreground/40">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {pages.map((p, i) => {
        const prev = pages[i - 1]
        const gap = prev && p - prev > 1
        return (
          <span key={p} className="flex items-center gap-1.5">
            {gap && <span className="px-1 text-muted-foreground">…</span>}
            <Link
              href={href(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-2 text-sm transition-colors ${
                p === page
                  ? 'border-transparent bg-foreground text-background'
                  : 'border-border text-foreground/70 hover:border-foreground/40'
              }`}
            >
              {p}
            </Link>
          </span>
        )
      })}

      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          aria-label="Page suivante"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border transition-colors hover:border-foreground/40"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border/40 text-muted-foreground/40">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  )
}
