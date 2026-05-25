#!/usr/bin/env bun
/**
 * Force-sync app-config/wlp-config.yml -> database.
 *
 * Truncates the `resources` table and re-inserts every entry from the YAML
 * in file order. Upserts `settings.welcome_text` from `welcome-text:`.
 *
 * Usage:
 *   DATABASE_URL=postgres://... bun run db:seed
 *   DATABASE_URL=postgres://... WLP_CONFIG_PATH=./other.yml bun run db:seed
 */
import { drizzle } from 'drizzle-orm/bun-sql'
import { sql } from 'drizzle-orm'
import { parse as parseYaml } from 'yaml'
import { resources, settings } from '../src/db/schema'

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

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const configPath = process.env.WLP_CONFIG_PATH ?? `${process.cwd()}/app-config/wlp-config.yml`
const file = Bun.file(configPath)
if (!(await file.exists())) {
  console.error(`Config not found: ${configPath}`)
  process.exit(1)
}

const config = parseYaml(await file.text()) as SeedConfig

const db = drizzle(DATABASE_URL, { schema: { resources, settings } })

await db.execute(
  sql.raw(`
  CREATE TABLE IF NOT EXISTS resources (
    id           SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    server_name  TEXT NOT NULL,
    url          TEXT NOT NULL,
    image        TEXT NOT NULL DEFAULT '',
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`),
)

await db.execute(
  sql.raw(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`),
)

const welcomeText = (config['welcome-text'] ?? '').trim()
if (welcomeText) {
  await db
    .insert(settings)
    .values({ key: 'welcome_text', value: welcomeText })
    .onConflictDoUpdate({ target: settings.key, set: { value: welcomeText } })
  console.log(`welcome_text → "${welcomeText}"`)
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

await db.execute(sql.raw('TRUNCATE TABLE resources RESTART IDENTITY'))
if (rows.length > 0) {
  await db.insert(resources).values(rows)
}

console.log(`Inserted ${rows.length} resource(s) from ${configPath}`)
process.exit(0)
