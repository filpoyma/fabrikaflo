#!/usr/bin/env bash
# First-time server setup for fabrikaflo auto-deploy.
# Run as deploy user (e.g. fabrikaflo) with sudo for pm2 startup.
#
# NGINX: configure manually from deploy/nginx/fabrikaflo.conf

set -euo pipefail

APP_ROOT="${APP_ROOT:-/var/www/fabrikaflo}"
REPO_URL="${REPO_URL:-git@github.com:filpoyma/fabrikaflo.git}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"

log() { printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
die() { log "ERROR: $*"; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"
}

require_cmd git
require_cmd node
require_cmd pnpm

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
[ "$NODE_MAJOR" -ge 22 ] || die "Install Node.js >= 22 first"

if ! command -v pm2 >/dev/null 2>&1; then
  log "Installing PM2 globally"
  pnpm add -g pm2
fi

if [ ! -d "$APP_ROOT/.git" ]; then
  log "Cloning repository into $APP_ROOT"
  sudo mkdir -p "$(dirname "$APP_ROOT")"
  sudo git clone --branch "$DEPLOY_BRANCH" "$REPO_URL" "$APP_ROOT"
  sudo chown -R "$(whoami):$(id -gn)" "$APP_ROOT"
else
  log "Repository already exists at $APP_ROOT"
fi

chmod +x "$APP_ROOT/deploy/deploy.sh"

log "Creating fabrikaflo_bot .env if missing"
if [ ! -f "$APP_ROOT/fabrikaflo_bot/.env" ]; then
  cat <<'EOF' > "$APP_ROOT/fabrikaflo_bot/.env"
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
LOG_PRETTY=false
DATABASE_URL=postgresql://user:password@127.0.0.1:5432/fabrikaflo
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_MODE=webhook
TELEGRAM_WEBHOOK_URL=https://fabrikaflo.mooo.com
MINI_APP_URL=https://fabrikaflo.mooo.com/webapp/
JWT_SECRET=change-me
CORS_ORIGINS=https://fabrikaflo.mooo.com
EOF
  log "Created fabrikaflo_bot/.env — edit it before first deploy"
fi

log "NGINX is not configured by this script."
log "Apply deploy/nginx/fabrikaflo.conf manually, then: sudo nginx -t && sudo systemctl reload nginx"

log "Running first deploy"
"$APP_ROOT/deploy/deploy.sh"

log "Enabling PM2 on system boot"
pm2 startup systemd -u "$(whoami)" --hp "$HOME" | tail -1 | bash || true
pm2 save

log "Setup complete. Configure GitHub Actions secrets:"
log "  DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY"
