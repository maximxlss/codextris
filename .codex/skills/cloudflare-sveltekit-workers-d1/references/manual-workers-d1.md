# Manual SvelteKit -> Workers + D1 Workflow

## 0) Preflight (always do)

- Use `web.run` to check the latest:
  - SvelteKit adapter for Cloudflare and expected `wrangler` config fields.
  - Cloudflare SvelteKit framework guide (Workers).
  - D1 command syntax and binding configuration.

## 1) Create or open the SvelteKit app

- **Existing app**: stay in the repo root.
- **New app**: use Cloudflare's framework CLI (C3) if the user wants a clean starter. Confirm it selects SvelteKit + Workers.

## 2) Install the Cloudflare adapter

```bash
npm i -D @sveltejs/adapter-cloudflare
```

Update `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/kit/vite';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter()
  }
};

export default config;
```

## 3) Add `wrangler.toml`

Start with the SvelteKit Cloudflare adapter layout (update the compatibility date):

```toml
name = "your-app-name"
main = ".svelte-kit/cloudflare/_worker.js"
compatibility_date = "2025-01-01"

[assets]
binding = "ASSETS"
directory = ".svelte-kit/cloudflare"

[[d1_databases]]
binding = "DB"
database_name = "your-db-name"
database_id = "<uuid-from-wrangler>"
```

Notes:
- Keep `binding` consistent with your code: `platform.env.DB`.
- Replace the date and IDs after checking docs or `wrangler d1 create` output.

## 4) Create the D1 database

```bash
npx wrangler d1 create your-db-name
```

- Copy the `[[d1_databases]]` block from the output into `wrangler.toml` (or use `--update-config` if available).

## 5) Add TypeScript platform types

Update `src/app.d.ts`:

```ts
import type { D1Database } from '@cloudflare/workers-types';

declare global {
  namespace App {
    interface Platform {
      env: {
        DB: D1Database;
      };
    }
  }
}

export {};
```

## 6) Use D1 in server routes

Example in a server endpoint:

```ts
export const GET = async ({ platform }) => {
  const db = platform?.env.DB;
  const { results } = await db.prepare('select * from users').all();
  return new Response(JSON.stringify(results));
};
```

## 7) Migrations (local + remote)

```bash
npx wrangler d1 migrations create your-db-name init
npx wrangler d1 migrations apply your-db-name --local
npx wrangler d1 migrations apply your-db-name --remote
```

## 8) Build, test, deploy

```bash
npm run build
npx wrangler dev .svelte-kit/cloudflare
npx wrangler deploy
```

- Confirm the deployed Worker responds correctly and the D1 queries execute.

## 9) Troubleshooting quick checks

- `platform.env` is undefined -> ensure adapter-cloudflare is set and you are running the Worker build.
- D1 errors -> check binding name, database ID, and that migrations were applied remotely.
