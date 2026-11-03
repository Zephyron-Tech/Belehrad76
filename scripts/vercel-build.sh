#!/bin/sh
# Build na Vercelu: nejdřív migrace databáze (Neon), pak build aplikace.
# Migrace běží přes přímé spojení (DATABASE_URL_UNPOOLED z Neon integrace), přes pooler
# se mohou zaseknout. Když databáze při buildu není k dispozici, migrace se přeskočí
# s varováním a web se nasadí i tak (migrace pak pustit ručně: npx prisma migrate deploy).
# Selže-li migrace samotná, build skončí chybou a na Vercelu zůstane předchozí verze.
set -e

MIGRATE_URL="${DATABASE_URL_UNPOOLED:-${POSTGRES_URL_NON_POOLING:-$DATABASE_URL}}"

if [ -n "$MIGRATE_URL" ]; then
  echo "[vercel-build] prisma migrate deploy"
  DATABASE_URL="$MIGRATE_URL" npx prisma migrate deploy
else
  echo "[vercel-build] VAROVÁNÍ: DATABASE_URL při buildu chybí – migrace přeskočeny"
fi

npm run build
