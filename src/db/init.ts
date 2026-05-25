import 'server-only'
import { parse as parseYaml } from 'yaml'
import { sql } from 'drizzle-orm'
import { db } from './index'
import { resources, settings } from './schema'

const CREATE_RESOURCES_SQL = `
  CREATE TABLE IF NOT EXISTS resources (
    id           SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    server_name  TEXT NOT NULL,
    url          TEXT NOT NULL,
    image        TEXT NOT NULL DEFAULT '',
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`

const CREATE_SETTINGS_SQL = `
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`

type SeedResource = {
  name?: string
  server_name?: string
  url?: string
  image?: string
}

type SeedConfig = {
  'welcome-text'?: string
  resources?: SeedResource[]
}

async function readSeedConfig(): Promise<SeedConfig | null> {
  const configPath = process.env.WLP_CONFIG_PATH ?? `${process.cwd()}/app-config/wlp-config.yml`
  const file = Bun.file(configPath)
  if (!(await file.exists())) return null
  const raw = await file.text()
  return parseYaml(raw) as SeedConfig
}

async function ensureTables(): Promise<void> {
  await db.execute(sql.raw(CREATE_RESOURCES_SQL))
  await db.execute(sql.raw(CREATE_SETTINGS_SQL))
}

async function seedIfEmpty(): Promise<void> {
  const existing = await db.select({ id: resources.id }).from(resources).limit(1)
  if (existing.length > 0) return

  const config = await readSeedConfig()
  if (!config) return

  const welcomeText = (config['welcome-text'] ?? '').trim()
  if (welcomeText) {
    await db
      .insert(settings)
      .values({ key: 'welcome_text', value: welcomeText })
      .onConflictDoNothing()
  }

  const rows = (config.resources ?? [])
    .map((r, idx) => ({
      name: (r.name ?? '').trim(),
      serverName: (r.server_name ?? '').trim(),
      url: (r.url ?? '').trim(),
      image: (r.image ?? '').trim(),
      sortOrder: idx,
    }))
    .filter((r) => r.name && r.url)

  if (rows.length > 0) {
    await db.insert(resources).values(rows)
  }
}

let initPromise: Promise<void> | null = null

export function initDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await ensureTables()
      await seedIfEmpty()
    })().catch((err) => {
      initPromise = null
      throw err
    })
  }
  return initPromise
}
