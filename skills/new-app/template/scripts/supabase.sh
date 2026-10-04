#!/usr/bin/env bash
# Wrapper around the Supabase CLI.
#
# The CLI is a dev dependency, pinned in package.json, so every machine and CI
# run the same version and nobody installs it by hand. A global `supabase` is
# used only if the local one is missing (before `pnpm install`).
#
# The CLI talks to a Docker-compatible socket. On machines where Podman stands
# in for Docker, DOCKER_HOST has to point at Podman's socket or every `supabase`
# command fails with a confusing "cannot connect" error.
set -euo pipefail

if ! command -v docker >/dev/null 2>&1 && command -v podman >/dev/null 2>&1; then
  if [ -z "${DOCKER_HOST:-}" ]; then
    socket="$(podman machine inspect podman-machine-default \
      --format '{{.ConnectionInfo.PodmanSocket.Path}}' 2>/dev/null || true)"
    # Linux runs Podman without a machine: its socket is the user's own
    # (systemctl --user start podman.socket).
    [ -z "$socket" ] && [ -S "${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/podman/podman.sock" ]       && socket="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/podman/podman.sock"
    if [ -n "$socket" ]; then
      export DOCKER_HOST="unix://$socket"
    fi
  fi
fi

root="$(cd "$(dirname "$0")/.." && pwd)"
if [ -x "$root/node_modules/.bin/supabase" ]; then
  exec "$root/node_modules/.bin/supabase" "$@"
fi
exec supabase "$@"
