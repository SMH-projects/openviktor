#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "$0")" && pwd)
fixture=$(mktemp -d)
trap 'rm -rf -- "$fixture"' EXIT
env_file="$fixture/.env"
printf 'SLACK_BOT_TOKEN=existing-secret\n' > "$env_file"
chmod 600 "$env_file"

"$script_dir/provision-discovery.sh" "$env_file" cmutpkopd0000p417lswjr97k read_learnings
test "$(stat -f %Lp "$env_file" 2>/dev/null || stat -c %a "$env_file")" = 600
test "$(grep -c '^SLACK_BOT_TOKEN=existing-secret$' "$env_file")" = 1
test "$(grep -c '^VIKTOR_DISCOVERY_TOKEN=' "$env_file")" = 1
test "$(grep -c '^VIKTOR_DISCOVERY_WORKSPACE_ID=cmutpkopd0000p417lswjr97k$' "$env_file")" = 1
test "$(grep -c '^VIKTOR_DISCOVERY_ALLOWED_TOOLS=read_learnings$' "$env_file")" = 1
token_before=$(sed -n 's/^VIKTOR_DISCOVERY_TOKEN=//p' "$env_file")
test "${#token_before}" -ge 32

"$script_dir/provision-discovery.sh" "$env_file" cmutpkopd0000p417lswjr97k read_learnings
token_after=$(sed -n 's/^VIKTOR_DISCOVERY_TOKEN=//p' "$env_file")
test "$token_before" = "$token_after"

for bad_tool in write_learning 'read_learnings,write_learning'; do
  if "$script_dir/provision-discovery.sh" "$env_file" cmutpkopd0000p417lswjr97k "$bad_tool" >/dev/null 2>&1; then
    echo 'mutating tool was admitted' >&2
    exit 1
  fi
done
if "$script_dir/provision-discovery.sh" "$env_file" 'wrong;workspace' read_learnings >/dev/null 2>&1; then
  echo 'invalid workspace was admitted' >&2
  exit 1
fi
test "$(sed -n 's/^VIKTOR_DISCOVERY_TOKEN=//p' "$env_file")" = "$token_before"

ln -s "$env_file" "$fixture/symlink"
if "$script_dir/provision-discovery.sh" "$fixture/symlink" cmutpkopd0000p417lswjr97k read_learnings >/dev/null 2>&1; then
  echo 'symlink secret target was admitted' >&2
  exit 1
fi
echo 'provision-discovery: PASS (mode, idempotence, fail-closed, no secret output)'
