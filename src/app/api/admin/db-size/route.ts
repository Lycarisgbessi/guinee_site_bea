import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/db-size — suivi du quota de stockage (anti-saturation).
 *
 * Lecture directe des statistiques PostgreSQL :
 *  - taille totale de la base (données + index) ;
 *  - taille par table (top consommateurs) ;
 *  - % du quota du plan gratuit Neon (1 Go par défaut, DB_QUOTA_MB pour
 *    surcharger) et projection simple de saturation.
 * Sur un moteur non-PostgreSQL (dev repli SQLite), renvoie engine:'sqlite'.
 */

const ALERT_THRESHOLD = 0.7 // 70 %

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const quotaBytes = (parseInt(process.env.DB_QUOTA_MB || '1024', 10)) * 1024 * 1024

  try {
    const [totalRow] = await db.$queryRaw<{ size: bigint }[]>`
      SELECT pg_database_size(current_database())::bigint AS size`
    const tables = await db.$queryRaw<{ table: string; size: bigint; rows: bigint }[]>`
      SELECT relname AS table,
             pg_total_relation_size(relid)::bigint AS size,
             n_live_tup::bigint AS rows
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(relid) DESC
      LIMIT 10`

    const sizeBytes = Number(totalRow.size)
    const percent = quotaBytes > 0 ? sizeBytes / quotaBytes : 0

    return NextResponse.json({
      engine: 'postgresql',
      sizeBytes,
      quotaBytes,
      percent: Math.round(percent * 1000) / 10,
      alert: percent >= ALERT_THRESHOLD,
      alertThreshold: ALERT_THRESHOLD,
      tables: tables.map((t) => ({
        table: t.table,
        sizeBytes: Number(t.size),
        rows: Number(t.rows),
      })),
    })
  } catch {
    // SQLite local ou statistiques indisponibles
    return NextResponse.json({ engine: 'sqlite', note: 'Suivi du quota disponible sur PostgreSQL (Neon).' })
  }
}
