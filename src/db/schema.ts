import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const resources = pgTable('resources', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  serverName: text('server_name').notNull(),
  url: text('url').notNull(),
  image: text('image').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})

export type Resource = typeof resources.$inferSelect
export type NewResource = typeof resources.$inferInsert
