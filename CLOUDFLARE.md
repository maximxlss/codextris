# Cloudflare Workers + D1 setup (leaderboards)

This project now uses Cloudflare Workers + D1 for leaderboards. The browser calls the SvelteKit API routes under `/api/leaderboard/*` and the server queries D1.

## Prerequisites

- Cloudflare account
- `wrangler` CLI available via `npx wrangler`

## 1) Configure `wrangler.toml`

`wrangler.toml` is checked in with placeholders. Create your D1 database and replace the `database_id`:

```bash
npx wrangler d1 create codextris-db
```

Copy the `[[d1_databases]]` block from the output into `wrangler.toml` (or replace the placeholder ID).

## 2) Apply migrations

```bash
npx wrangler d1 migrations apply codextris-db --local
npx wrangler d1 migrations apply codextris-db --remote
```

Migrations live in `migrations/` (initial schema is `migrations/0001_init.sql`).

## 3) Local development

- UI only (leaderboards show offline):

```bash
npm run dev
```

- Full Workers + D1:

```bash
npm run build
npx wrangler dev .svelte-kit/cloudflare
```

## 4) Deploy

```bash
npm run build
npx wrangler deploy
```

## Optional public env vars

- `PUBLIC_LEADERBOARD_ENABLED=false` disables leaderboard calls in the client.
- `PUBLIC_API_BASE_URL` can point the client to a different API origin (default: same origin).

## GitHub Actions (CI deploy)

The workflow in `.github/workflows/deploy.yml` deploys the Worker with Wrangler. Add these GitHub secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
