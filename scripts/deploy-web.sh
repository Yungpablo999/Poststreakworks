#!/usr/bin/env bash
# Builds the Expo web app and deploys it to the Cloudflare Worker "poststreak-app"
# (static assets, SPA routing: see wrangler.jsonc). See docs/DEPLOY_WEB.md.
set -euo pipefail
cd "$(dirname "$0")/.."

for v in EXPO_PUBLIC_API_URL EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_SUPABASE_ANON_KEY; do
  if [ -z "${!v:-}" ]; then
    echo "$v is not set (see docs/DEPLOY_WEB.md)" >&2
    exit 1
  fi
done

rm -rf dist
npx expo export --platform web

# Only public values may be in the bundle
if grep -rqE "service_role|sb_secret_[A-Za-z0-9]|sk_(live|test)_" dist/_expo; then
  echo "A secret-looking value is in dist/. Not deploying." >&2
  exit 1
fi

npx wrangler@4 deploy
