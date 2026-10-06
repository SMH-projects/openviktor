#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo 'usage: provision-discovery.sh ENV_FILE WORKSPACE_ID read_learnings' >&2
  exit 2
fi

env_file=$1
workspace_id=$2
allowed_tools=$3
if [ "$allowed_tools" != read_learnings ] || [[ ! "$workspace_id" =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo 'discovery requires an explicit workspace and approved read-only tool' >&2
  exit 2
fi
if [ -L "$env_file" ] || [ ! -f "$env_file" ]; then
  echo 'environment file must be an existing regular file, not a symlink' >&2
  exit 2
fi
mode=$(stat -f '%Lp' "$env_file" 2>/dev/null || stat -c %a "$env_file")
if [ "$mode" != 600 ]; then
  echo 'environment file must be mode 0600' >&2
  exit 2
fi

lock_dir="${env_file}.viktor.lock"
if ! mkdir -- "$lock_dir" 2>/dev/null; then
  echo 'discovery provisioning already running or lock needs manual inspection' >&2
  exit 2
fi
temp_file=
cleanup() {
  if [ -n "$temp_file" ]; then
    rm -f -- "$temp_file"
  fi
  rmdir -- "$lock_dir"
}
trap cleanup EXIT

if grep -q '^VIKTOR_DISCOVERY_' "$env_file"; then
  echo 'discovery already configured; refusing to trust or rotate an existing token' >&2
  exit 2
fi

temp_file=$(mktemp "${env_file}.viktor.XXXXXX")
chmod 600 "$temp_file"
cat -- "$env_file" > "$temp_file"
if ! generated_token=$(openssl rand -hex 32) || [[ ! "$generated_token" =~ ^[0-9a-f]{64}$ ]]; then
  echo 'cryptographic token generation failed; environment unchanged' >&2
  exit 2
fi
printf '\nVIKTOR_DISCOVERY_TOKEN=%s\nVIKTOR_DISCOVERY_WORKSPACE_ID=%s\nVIKTOR_DISCOVERY_ALLOWED_TOOLS=%s\n' \
  "$generated_token" "$workspace_id" "$allowed_tools" >> "$temp_file"
mv -- "$temp_file" "$env_file"
temp_file=
echo 'dedicated discovery configuration installed (0600; no token printed)'
