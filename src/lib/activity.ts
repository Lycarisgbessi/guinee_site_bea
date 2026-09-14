import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** Enregistre une action sensible dans le journal d'activité (§11 audit log) */
export async function logActivity(action: string, target?: string, detail?: string) {
  try {
    const session = await getSession()
    await db.activityLog.create({
      data: {
        userId: session?.userId ?? null,
        action,
        target: target ?? null,
        detail: detail ?? null,
      },
    })
  } catch {
    // le journal ne doit jamais faire échouer l'action métier
  }
}
