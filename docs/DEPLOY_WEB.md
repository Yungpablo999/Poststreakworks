# Deploying the web app (Cloudflare)

The web version of the app is a static Expo export served by a Cloudflare Worker
named `poststreak-app` (static assets, config in `wrangler.jsonc`). Any path that
isn't a real file, such as `/connect/finalize`, serves `index.html`, so deep links load the app.

## Redeploy

1. `npx wrangler login` (once; use the Cloudflare account that owns `poststreak-app`).
2. Export the three public values the build bakes in. They are not secrets, but never put
   anything else here:
   ```bash
   export EXPO_PUBLIC_API_URL=https://poststreak.app
   export EXPO_PUBLIC_SUPABASE_URL=...        # same as poststreak-web NEXT_PUBLIC_SUPABASE_URL
   export EXPO_PUBLIC_SUPABASE_ANON_KEY=...   # same as poststreak-web NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
3. `npm run deploy:web`

The script refuses to run if a variable is missing, and refuses to deploy if the bundle
contains a secret-looking value. The first run gives a `*.workers.dev` URL.

## Notes
- `EXPO_PUBLIC_API_URL` has no default on purpose: a build without it throws at runtime.
- Rollback: redeploy an earlier commit, or use Workers > poststreak-app > Deployments in the dashboard.
