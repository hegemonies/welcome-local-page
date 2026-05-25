# Welcome Local Page

A tiny home-server dashboard that renders a list of links to LAN services (Gitea, Grafana, Prometheus, VaultWarden, …). Originally a Rails app, now rewritten on Next.js 15 + PostgreSQL with full CRUD over a stored resource list.

## Stack

- [Bun](https://bun.sh) as runtime + package manager
- Next.js 15 (App Router, React Server Components, server actions)
- TypeScript
- PostgreSQL 16
- Drizzle ORM (`drizzle-orm`, `pg`)
- YAML used only as initial-seed format for the DB
- Original CSS / JetBrains Mono ExtraBold typography preserved

## Pages

- `/` — read-only dashboard. Same look as the original Rails version.
- `/admin` — CRUD: edit welcome text, add / edit / delete resources.

## Configuration

| Env var               | Default                                       | Purpose                                  |
|-----------------------|-----------------------------------------------|------------------------------------------|
| `DATABASE_URL`        | `postgres://wlp:wlp@localhost:5432/wlp`       | Postgres connection string               |
| `WLP_CONFIG_PATH`     | `app-config/wlp-config.yml`                   | YAML used for the **initial** DB seed    |
| `POSTGRES_DB`         | `wlp`                                         | (compose) database name                  |
| `POSTGRES_USER`       | `wlp`                                         | (compose) user                           |
| `POSTGRES_PASSWORD`   | `wlp`                                         | (compose) password                       |

The YAML at `app-config/wlp-config.yml` is loaded **only once**, when the `resources` table is empty. After that, all changes live in the database and the YAML is ignored. To re-seed, drop the table (or the postgres volume) and restart.

## Local development

Requires Bun ≥ 1.1 — install from https://bun.sh.

```sh
bun install

# Start a local Postgres (or run `docker-compose up -d db`)
export DATABASE_URL=postgres://wlp:wlp@localhost:5432/wlp

# Dev server on http://localhost:3000
bun run dev
```

Drizzle migration generation (optional, schema lives in `src/db/schema.ts`):

```sh
bun run db:generate  # writes SQL to ./drizzle
bun run db:push      # pushes schema to the configured DB
```

Tables are also created automatically at runtime via `instrumentation.ts` if they don't exist (`CREATE TABLE IF NOT EXISTS`), so a manual migration step is **not required** for first boot.

## Docker

Image is based on `oven/bun:1-alpine`. Build and publish to the LAN registry:

```sh
make build-docker        # docker build --tag lt:5000/welcome-local-page:latest .
make push-docker
make build-push-docker
```

Run the full stack (app + Postgres) via compose:

```sh
docker-compose up -d
# dashboard:  http://<host>:4000/
# admin:      http://<host>:4000/admin
```

The container's entrypoint is `bun server.js` (Next.js standalone output running under the Bun runtime). DB tables are created and seeded from `app-config/wlp-config.yml` on first start.

To override the initial seed file per host, uncomment the volume in `docker-compose.yml`:

```yaml
volumes:
  - ./app-config/wlp-config.yml:/app/app-config/wlp-config.yml:ro
```
