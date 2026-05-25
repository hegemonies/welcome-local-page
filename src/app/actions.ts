'use server'

import { revalidatePath } from 'next/cache'
import { eq, sql, asc } from 'drizzle-orm'
import { db } from '@/db'
import { resources, settings } from '@/db/schema'

function str(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function requireId(form: FormData): number {
  const raw = form.get('id')
  const id = Number.parseInt(typeof raw === 'string' ? raw : '', 10)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Invalid resource id')
  }
  return id
}

export async function updateWelcomeText(formData: FormData): Promise<void> {
  const value = str(formData, 'welcome_text')
  if (!value) throw new Error('welcome_text must not be empty')

  await db
    .insert(settings)
    .values({ key: 'welcome_text', value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })

  revalidatePath('/')
  revalidatePath('/admin')
}

export async function createResource(formData: FormData): Promise<void> {
  const name = str(formData, 'name')
  const serverName = str(formData, 'server_name')
  const url = str(formData, 'url')
  const image = str(formData, 'image')

  if (!name) throw new Error('name is required')
  if (!url) throw new Error('url is required')

  const maxRow = await db
    .select({ max: sql<number | null>`MAX(${resources.sortOrder})` })
    .from(resources)
  const nextOrder = (maxRow[0]?.max ?? -1) + 1

  await db.insert(resources).values({ name, serverName, url, image, sortOrder: nextOrder })

  revalidatePath('/')
  revalidatePath('/admin')
}

export async function updateResource(formData: FormData): Promise<void> {
  const id = requireId(formData)
  const name = str(formData, 'name')
  const serverName = str(formData, 'server_name')
  const url = str(formData, 'url')
  const image = str(formData, 'image')

  if (!name) throw new Error('name is required')
  if (!url) throw new Error('url is required')

  await db
    .update(resources)
    .set({ name, serverName, url, image })
    .where(eq(resources.id, id))

  revalidatePath('/')
  revalidatePath('/admin')
}

export async function deleteResource(formData: FormData): Promise<void> {
  const id = requireId(formData)
  await db.delete(resources).where(eq(resources.id, id))

  revalidatePath('/')
  revalidatePath('/admin')
}

export async function moveResource(formData: FormData): Promise<void> {
  const id = requireId(formData)
  const direction = formData.get('direction')
  if (direction !== 'up' && direction !== 'down') {
    throw new Error('direction must be "up" or "down"')
  }

  const ordered = await db
    .select({ id: resources.id, sortOrder: resources.sortOrder })
    .from(resources)
    .orderBy(asc(resources.sortOrder), asc(resources.id))

  const idx = ordered.findIndex((r) => r.id === id)
  if (idx < 0) return

  const neighborIdx = direction === 'up' ? idx - 1 : idx + 1
  if (neighborIdx < 0 || neighborIdx >= ordered.length) return

  const a = ordered[idx]
  const b = ordered[neighborIdx]

  await db.update(resources).set({ sortOrder: -1 }).where(eq(resources.id, a.id))
  await db.update(resources).set({ sortOrder: a.sortOrder }).where(eq(resources.id, b.id))
  await db.update(resources).set({ sortOrder: b.sortOrder }).where(eq(resources.id, a.id))

  revalidatePath('/')
  revalidatePath('/admin')
}
