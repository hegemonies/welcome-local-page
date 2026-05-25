import 'server-only'
import { eq, asc } from 'drizzle-orm'
import { db } from '@/db'
import { resources, settings, type Resource } from '@/db/schema'

const DEFAULT_WELCOME_TEXT = 'Welcome local page'

export async function getWelcomeText(): Promise<string> {
  const row = await db.select().from(settings).where(eq(settings.key, 'welcome_text')).limit(1)
  return row[0]?.value ?? DEFAULT_WELCOME_TEXT
}

export async function getResources(): Promise<Resource[]> {
  return db.select().from(resources).orderBy(asc(resources.sortOrder), asc(resources.id))
}
