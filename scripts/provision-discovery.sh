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

if grep -q '^VIKTOR_DISCOVERY_' "$env_file"; then
  existing_token=$(sed -n 's/^VIKTOR_DISCOVERY_TOKEN=//p' "$env_file")
  if [ "${#existing_token}" -ge 32 ] &&
    [ "$(grep -c '^VIKTOR_DISCOVERY_TOKEN=' "$env_file")" -eq 1 ] &&
    [ "$(grep -c '^VIKTOR_DISCOVERY_WORKSPACE_ID=' "$env_file")" -eq 1 ] &&
    [ "$(grep -c '^VIKTOR_DISCOVERY_ALLOWED_TOOLS=' "$env_file")" -eq 1 ] &&
    grep -qxF "VIKTOR_DISCOVERY_WORKSPACE_ID=$workspace_id" "$env_file" &&
    grep -qxF "VIKTOR_DISCOVERY_ALLOWED_TOOLS=$allowed_tools" "$env_file"; then
    echo 'discovery configuration already installed; token unchanged'
    exit 0
  fi
  echo 'existing discovery configuration differs; refusing implicit rotation' >&2
  exit 2
fi

temp_file=$(mktemp "${env_file}.viktor.XXXXXX")
trap 'rm -f -- "$temp_file"' EXIT
chmod 600 "$temp_file"
cat -- "$env_file" > "$temp_file"
printf '\nVIKTOR_DISCOVERY_TOKEN=%s\nVIKTOR_DISCOVERY_WORKSPACE_ID=%s\nVIKTOR_DISCOVERY_ALLOWED_TOOLS=%s\n' \
  "$(openssl rand -hex 32)" "$workspace_id" "$allowed_tools" >> "$temp_file"
mv -- "$temp_file" "$env_file"
trap - EXIT
echo 'dedicated discovery configuration installed (0600; no token printed)'
