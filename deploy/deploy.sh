#!/usr/bin/env bash
# Auto-deploy fabrikaflo: backend (PM2), admin frontend, Telegram webapp.
# Run on the server: ./deploy/deploy.sh
# Optional env: APP_ROOT, DEPLOY_BRANCH, SKIP_MIGRATE
#
# NGINX is not touched by this script — update deploy/nginx/fabrikaflo.conf manually.

set -euo pipefail

APP_ROOT="${APP_ROOT:-/var/www/fabrikaflo}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
SKIP_MIGRATE="${SKIP_MIGRATE:-0}"

log() { printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
die() { log "ERROR: $*"; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"
}

require_cmd git
require_cmd node
require_cmd pnpm
require_cmd pm2

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 22 ]; then
  die "Node.js >= 22 is required (fabrikaflo_bot uses native TypeScript)"
fi

[ -d "$APP_ROOT" ] || die "APP_ROOT does not exist: $APP_ROOT"
cd "$APP_ROOT"

log "Syncing code to origin/$DEPLOY_BRANCH (local changes on server will be discarded)"
git fetch origin "$DEPLOY_BRANCH"
git checkout "$DEPLOY_BRANCH"
git reset --hard "origin/$DEPLOY_BRANCH"
git clean -fd

pnpm_install() {
  local dir="$1"
  log "Removing stale dependencies in $dir"
  rm -rf "$dir/node_modules"
  (cd "$dir" && pnpm install --frozen-lockfile)
}

install_deps() {
  local dir="$1"
  log "Installing dependencies in $dir"
  pnpm_install "$dir"
}

build_frontend() {
  local dir="$1"
  log "Building $dir"
  pnpm_install "$dir"
  (cd "$dir" && pnpm run build)
}

log "=== Backend (fabrikaflo_bot) ==="
install_deps fabrikaflo_bot
(
  cd fabrikaflo_bot
  pnpm run prisma:generate
  if [ "$SKIP_MIGRATE" != "1" ]; then
    pnpm run db:deploy
  else
    log "Skipping database migrations (SKIP_MIGRATE=1)"
  fi
)

log "=== Admin panel (admin) ==="
build_frontend admin

log "=== Telegram Mini App (webapp) ==="
build_frontend webapp

log "=== PM2 ==="
pm2 startOrReload "$APP_ROOT/deploy/ecosystem.config.cjs" --env production
pm2 save

log "Deploy finished successfully"
pm2 status fabrikaflo-api
