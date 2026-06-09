#!/usr/bin/env bash
# Lance un chromium en tete avec un profil persistant et le port CDP.
# L'utilisateur se connecte a la main une fois, la session persiste dans le profil.
set -euo pipefail

PROFILE="${LINKEDIN_HARNESS_PROFILE:-$HOME/.config/chromium-playwright}"
PORT="${LINKEDIN_HARNESS_CDP_PORT:-9222}"
BIN="${LINKEDIN_HARNESS_CHROMIUM:-chromium}"

exec "$BIN" \
  --user-data-dir="$PROFILE" \
  --remote-debugging-port="$PORT" \
  --remote-debugging-address=127.0.0.1 \
  --remote-allow-origins=* \
  --window-size=1280,800 \
  --start-maximized \
  --no-first-run \
  --no-default-browser-check \
  --password-store=basic \
  --disable-dev-shm-usage \
  about:blank
