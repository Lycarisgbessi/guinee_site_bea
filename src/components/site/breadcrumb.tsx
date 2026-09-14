import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

/** Fil d’Ariane — navigation clavier et ARIA (§5.8, §12.3) */
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Fil d’Ariane" className="mb-1">
      <ol className="flex flex-wrap items-center gap-1 text-[12.5px] text-muted-foreground">
        <li>
          <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
            <Home className="h-3.5 w-3.5" />
            Accueil
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 opacity-60" />
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className="max-w-[280px] truncate text-foreground/80" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
