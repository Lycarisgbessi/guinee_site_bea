import { db } from '@/lib/db'

/**
 * MAINTENANCE ANTI-SATURATION (plan gratuit Neon = 1 Go)
 * ------------------------------------------------------
 * Exécutée chaque nuit par le cron Vercel (/api/cron/maintenance) et
 * déclenchable manuellement depuis le dashboard. Chaque règle vise une
 * source de croissance illimitée identifiée dans l'audit :
 *
 *  1. ArticleVersion — une copie COMPLÈTE du contenu par sauvegarde :
 *     on ne garde que les 10 dernières versions par article.
 *  2. ActivityLog — purge au-delà de 90 jours.
 *  3. Corbeille — suppression définitive au-delà de 30 jours (la règle
 *     existed mais aucun cron ne l'exécutait).
 *  4. ArticleView — les vues quotidiennes de plus de 90 jours sont
 *     compressées en un agrégat MENSUEL par article (÷30 la taille) ;
 *     les graphes du dashboard restent alimentés par le quotidien récent.
 *
 * Toutes les opérations sont idempotentes et atomiques (transaction).
 */

export interface MaintenanceReport {
  ranAt: string
  durationMs: number
  versionsKept: number // versions supprimées au-delà de la limite
  activityPurged: number
  trashPurged: number
  viewsRolledUp: number // lignes quotidiennes compressées en mensuel
}

const KEEP_VERSIONS_PER_ARTICLE = 10
const ACTIVITY_RETENTION_DAYS = 90
const TRASH_RETENTION_DAYS = 30
const DAILY_VIEWS_RETENTION_DAYS = 90

export async function runMaintenance(): Promise<MaintenanceReport> {
  const started = Date.now()
  const cutoffActivity = new Date(Date.now() - ACTIVITY_RETENTION_DAYS * 86400000)
  const cutoffTrash = new Date(Date.now() - TRASH_RETENTION_DAYS * 86400000)
  const cutoffViews = new Date(Date.now() - DAILY_VIEWS_RETENTION_DAYS * 86400000)
    .toISOString()
    .slice(0, 10)

  const report = await db.$transaction(
    async (tx) => {
      // 1. Versions : ne garder que les N plus récentes par article
      const versionsKept = await tx.$executeRawUnsafe(`
        DELETE FROM "ArticleVersion"
        WHERE id IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY "articleId" ORDER BY "createdAt" DESC) AS rn
            FROM "ArticleVersion"
          ) ranked WHERE ranked.rn > ${KEEP_VERSIONS_PER_ARTICLE}
        )`)

      // 2. Journal d'activité > 90 jours
      const activityPurged = await tx.activityLog.deleteMany({
        where: { createdAt: { lt: cutoffActivity } },
      })

      // 3. Corbeille > 30 jours (les commentaires/vues/versions partent en cascade)
      const trashed = await tx.article.findMany({
        where: { deletedAt: { lt: cutoffTrash } },
        select: { id: true },
      })
      for (const a of trashed) {
        await tx.article.delete({ where: { id: a.id } })
      }

      // 4. Rollup mensuel des vues anciennes (idempotent : transaction atomique)
      await tx.$executeRawUnsafe(`
        INSERT INTO "ArticleViewMonthly" ("id", "articleId", "month", "count")
        SELECT gen_random_uuid()::text, "articleId", substr("date", 1, 7), SUM("count")
        FROM "ArticleView"
        WHERE "date" < '${cutoffViews}'
        GROUP BY "articleId", substr("date", 1, 7)
        ON CONFLICT ("articleId", "month") DO UPDATE
          SET "count" = "ArticleViewMonthly"."count" + EXCLUDED."count"`)
      const viewsRolledUp = await tx.$executeRawUnsafe(`
        DELETE FROM "ArticleView" WHERE "date" < '${cutoffViews}'`)

      return {
        versionsKept: Number(versionsKept),
        activityPurged: activityPurged.count,
        trashPurged: trashed.length,
        viewsRolledUp: Number(viewsRolledUp),
      }
    },
    { timeout: 50_000 },
  )

  // Publication des articles programmés échus (filet de sécurité quotidien)
  await db.article.updateMany({
    where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  }).catch(() => {})

  return {
    ranAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    ...report,
  }
}
