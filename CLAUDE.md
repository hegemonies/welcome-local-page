# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page Next.js 15 app that renders a "welcome / home dashboard" of links to other services running on a LAN (Gitea, Grafana, Prometheus, VaultWarden, …). Originally a Rails 7 app — fully rewritten on Next.js + PostgreSQL while keeping the original visual design.

Bun 1.x as runtime + package manager, Next.js 15 (App Router, server actions, RSC), TypeScript, PostgreSQL 16, Drizzle ORM via the **`drizzle-orm/bun-sql` adapter** — i.e. Bun's built-in `Bun.SQL` is the Postgres client at runtime. **There is no `pg` in the runtime bundle.** `pg`/`@types/pg` stay as `devDependencies` only because `drizzle-kit` CLI uses them for `db:push` / `db:generate`. No client-side state library — server components + `<form action={serverAction}>` + `revalidatePath`. There is no Node toolchain in this repo — don't add `npm`/`yarn`/`pnpm` lockfiles; the source of truth is `bun.lockb`.

## Architecture

The app is intentionally tiny: two pages, one DB, no API routes.

- `src/app/page.tsx` — root dashboard (server component). Calls `getWelcomeText()` + `getResources()` from `src/lib/data.ts` and renders the same layout the Rails view produced.
- `src/app/admin/page.tsx` — CRUD UI. Native `<form action={...}>` posts to server actions in `src/app/actions.ts`. Mutations call `revalidatePath('/')` so the public dashboard updates immediately.
- `src/db/schema.ts` — two Drizzle tables: `resources` and `settings` (key/value, used for the `welcome_text`).
- `src/db/index.ts` — Drizzle instance wrapping `Bun.SQL` (via `drizzle-orm/bun-sql`). Connection string comes from `DATABASE_URL`. In dev the instance is cached on `globalThis` so HMR doesn't open new connections per reload.
- `src/db/init.ts` — runs `CREATE TABLE IF NOT EXISTS` and, **only if `resources` is empty**, seeds from `app-config/wlp-config.yml`. After the first run YAML is irrelevant. Uses `db.execute(sql.raw(...))` for DDL — don't reach for raw `pg` clients here, the point is to stay on `Bun.SQL`.
- `src/instrumentation.ts` — Next.js startup hook. Calls `initDatabase()` once when the Node runtime boots. Errors are logged but do not crash the server (allows DB to come up shortly after the app).
- `src/app/globals.css` — verbatim port of the original Rails stylesheet plus a small admin block. JetBrains Mono ExtraBold (`public/fonts/...`) and the gray placeholder SVG (`public/resource-image-empty.svg`) are unchanged.

Drizzle migrations live in `./drizzle` and are generated with `npm run db:generate`. They are **not** required at runtime — the `CREATE TABLE IF NOT EXISTS` path in `init.ts` is what actually runs in production. Keep both in sync if you change `schema.ts`.

## Commands

Local dev:
- `bun install` then `bun run dev` — Next dev server on port 3000 (`bun --bun next dev`, i.e. the Next server runs under the Bun runtime, not Node).
- `bun run build` / `bun run start` — production build (uses `output: 'standalone'`). `build` deliberately does **not** force `--bun` so the SWC native binary path stays on the well-tested route; `start` does force `--bun` since that's where our request code actually runs.
- `bun run lint` / `bun run typecheck`.
- `bun run db:generate` / `bun run db:push` — Drizzle Kit (optional; runtime auto-creates tables).
- Need a local Postgres for dev — easiest is `docker-compose up -d db` and `export DATABASE_URL=postgres://wlp:wlp@localhost:5432/wlp`.

Docker (publishes to a private registry `lt:5000`):
- Base image is `oven/bun:1-alpine`. Entrypoint runs `bun server.js` against the Next.js standalone output. There is no Node binary in the image — don't add code paths that shell out to `node`.
- `make build-docker` / `make push-docker` / `make build-push-docker`.
- `docker-compose up -d` — runs Postgres + the app. Host port **4000** → container 3000.

## Conventions specific to this repo

- The Docker target registry (`lt:5000`) is a host on the user's LAN; commands like `make push-docker` will fail outside that network. Don't "fix" the tag.
- `RAILS_ENV=development` is gone — the new app runs with `NODE_ENV=production` in the image. Compose sets it.
- YAML is **seed-only**. Do not read from `wlp-config.yml` at request time. The dashboard reads from Postgres. If you need to support config-file-only mode again, add an explicit flag — don't bolt it onto the read path.
- Schema changes: update `src/db/schema.ts` **and** the `CREATE TABLE IF NOT EXISTS` block in `src/db/init.ts`, then regenerate Drizzle migrations with `npm run db:generate`.
- The public page and admin page both `export const dynamic = 'force-dynamic'` — there is no caching. This is intentional for a LAN dashboard with infrequent writes.
- Use server actions for mutations. Don't add API routes for CRUD unless something external needs to call them.
- Keep `<img>` (not `next/image`) for the resource card pictures so the original CSS continues to control layout. ESLint rule is suppressed inline only at that spot.
