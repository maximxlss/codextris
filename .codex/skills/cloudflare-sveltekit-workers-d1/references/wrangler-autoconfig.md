# Wrangler Auto-Config (Experimental)

Use this when the user wants the fastest setup and accepts experimental tooling. Always verify the generated config.

## Flow

1. Run Wrangler auto-setup from the project root:

```bash
npx wrangler setup
```

2. If the user is deploying immediately, Wrangler can also attempt automatic configuration during deploy:

```bash
npx wrangler deploy --x-autoconfig
```

3. Inspect the generated `wrangler.toml` or `wrangler.jsonc` and confirm:

- `main` points to `.svelte-kit/cloudflare/_worker.js`.
- `[assets]` binding and directory are set for SvelteKit adapter.
- D1 binding block exists and matches the DB name and ID.

4. If any fields are missing or incorrect, switch back to the manual workflow.
