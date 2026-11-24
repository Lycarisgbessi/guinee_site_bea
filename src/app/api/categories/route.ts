import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getVisibleCategories } from '@/lib/public-queries'

/** GET /api/categories — rubriques actives (§8.2) */
export async function GET() {
  const categories = await getVisibleCategories()
  return NextResponse.json({ categories })
}
