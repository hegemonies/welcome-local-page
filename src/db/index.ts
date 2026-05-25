import 'server-only'
import { drizzle, type BunSQLDatabase } from 'drizzle-orm/bun-sql'
import * as schema from './schema'

declare global {
  // eslint-disable-next-line no-var
  var __wlpDb: BunSQLDatabase<typeof schema> | undefined
}

function createDb(): BunSQLDatabase<typeof schema> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }
  return drizzle(connectionString, { schema })
}

export const db: BunSQLDatabase<typeof schema> = globalThis.__wlpDb ?? createDb()
if (process.env.NODE_ENV !== 'production') {
  globalThis.__wlpDb = db
}
