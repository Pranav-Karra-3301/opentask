#!/bin/sh
# OpenTask demo supervisor — wipe, seed, serve, repeat.
#
# This is the whole "public demo" mechanism. Rather than a host cron or a systemd timer, the reset
# lives inside the container so the demo is reproducible anywhere with one `docker run` (see
# docker-compose.yml next to this file, and docs/install.md § Run a disposable demo).
#
# Each cycle:
#   1. wipe /data           — the DB, attachments, and secrets.json all regenerate
#   2. seed                 — with the server DOWN, so nothing else holds the WAL
#   3. serve until timeout  — `timeout` sends SIGTERM; the server's own SIGTERM handler
#                             (apps/server/src/index.ts) closes SQLite cleanly
#
# Why re-seed every cycle instead of restoring a golden snapshot: the frozen dataset resolves
# RELATIVE dates at seed time (seed.ts pins America/New_York and parses through the real
# parseQuickAdd), so a snapshot captured yesterday would show yesterday's "today". Re-seeding
# keeps the demo permanently date-correct.
#
# The server reads OPENTASK_DEMO_RESET_SECONDS too, and reports `resets_at` on /api/v1/info from
# its own start time — which is why the countdown in the UI matches this loop without any shared
# state.
set -eu

RESET_SECONDS="${OPENTASK_DEMO_RESET_SECONDS:-1800}"
DATA_DIR="${OPENTASK_DATA_DIR:-/data}"

if [ "${OPENTASK_DEMO_MODE:-}" != "true" ]; then
  echo "demo: refusing to run — OPENTASK_DEMO_MODE must be true (this script DELETES $DATA_DIR)" >&2
  exit 2
fi

echo "demo: supervisor starting; resetting every ${RESET_SECONDS}s"

while true; do
  echo "demo: wiping $DATA_DIR"
  # -mindepth 1 so the mount point itself survives (it is a bind mount / volume).
  find "$DATA_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +

  echo "demo: seeding"
  ./node_modules/.bin/tsx src/seed.ts

  echo "demo: serving for ${RESET_SECONDS}s"
  # `|| true`: timeout exits 124 when it fires, which is the expected path, and `set -e` would
  # otherwise kill the supervisor on the very first successful cycle.
  timeout -s TERM "$RESET_SECONDS" ./node_modules/.bin/tsx src/index.ts || true

  echo "demo: cycle complete, restarting"
done
