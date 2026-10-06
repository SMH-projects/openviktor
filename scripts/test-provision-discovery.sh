#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "$0")" && pwd)
fixture=$(mktemp -d)
trap 'rm -rf -- "$fixture"' EXIT
env_file="$fixture/.env"
printf 'SLACK_BOT_TOKEN=existing-secret\n' > "$env_file"
chmod 600 "$env_file"

mkdir "$fixture/failing-bin"
printf '#!/bin/sh\nexit 1\n' > "$fixture/failing-bin/openssl"
chmod +x "$fixture/failing-bin/openssl"
if PATH="$fixture/failing-bin:$PATH" "$script_dir/provision-discovery.sh" "$env_file" cmutpkopd0000p417lswjr97k read_learnings > "$fixture/failure-output" 2>&1; then
  echo 'failed random generator was accepted' >&2
  exit 1
fi
test "$(cat "$env_file")" = 'SLACK_BOT_TOKEN=existing-secret'

concurrent_env="$fixture/concurrent.env"
printf 'SLACK_BOT_TOKEN=existing-secret\n' > "$concurrent_env"
chmod 600 "$concurrent_env"
mkdir "$fixture/delayed-bin"
real_openssl=$(command -v openssl)
cat > "$fixture/delayed-bin/openssl" <<EOF
#!/bin/sh
touch '$fixture/generator-entered'
sleep 2
exec '$real_openssl' "\$@"
EOF
chmod +x "$fixture/delayed-bin/openssl"
PATH="$fixture/delayed-bin:$PATH" "$script_dir/provision-discovery.sh" "$concurrent_env" cmutpkopd0000p417lswjr97k read_learnings > "$fixture/first-output" 2>&1 &
first_pid=$!
for _ in {1..100}; do
  [ -f "$fixture/generator-entered" ] && break
  sleep 0.05
done
test -f "$fixture/generator-entered"
if PATH="$fixture/delayed-bin:$PATH" "$script_dir/provision-discovery.sh" "$concurrent_env" cmutpkopd0000p417lswjr97k read_learnings > "$fixture/second-output" 2>&1; then
  echo 'concurrent token rotation was accepted' >&2
  exit 1
fi
wait "$first_pid"
test "$(grep -c '^VIKTOR_DISCOVERY_TOKEN=' "$concurrent_env")" = 1

"$script_dir/provision-discovery.sh" "$env_file" cmutpkopd0000p417lswjr97k read_learnings
test "$(stat -f %Lp "$env_file" 2>/dev/null || stat -c %a "$env_file")" = 600
test "$(grep -c '^SLACK_BOT_TOKEN=existing-secret$' "$env_file")" = 1
test "$(grep -c '^VIKTOR_DISCOVERY_TOKEN=' "$env_file")" = 1
test "$(grep -c '^VIKTOR_DISCOVERY_WORKSPACE_ID=cmutpkopd0000p417lswjr97k$' "$env_file")" = 1
test "$(grep -c '^VIKTOR_DISCOVERY_ALLOWED_TOOLS=read_learnings$' "$env_file")" = 1
token_before=$(sed -n 's/^VIKTOR_DISCOVERY_TOKEN=//p' "$env_file")
test "${#token_before}" -ge 32

if "$script_dir/provision-discovery.sh" "$env_file" cmutpkopd0000p417lswjr97k read_learnings > "$fixture/repeat-output" 2>&1; then
  echo 'existing unverified bearer was accepted on retry' >&2
  exit 1
fi
token_after=$(sed -n 's/^VIKTOR_DISCOVERY_TOKEN=//p' "$env_file")
test "$token_before" = "$token_after"

shared_secret=$(printf '%064d' 7)
shared_env="$fixture/shared.env"
printf 'SLACK_BOT_TOKEN=%s\nVIKTOR_DISCOVERY_TOKEN=%s\nVIKTOR_DISCOVERY_WORKSPACE_ID=cmutpkopd0000p417lswjr97k\nVIKTOR_DISCOVERY_ALLOWED_TOOLS=read_learnings\n' "$shared_secret" "$shared_secret" > "$shared_env"
chmod 600 "$shared_env"
if "$script_dir/provision-discovery.sh" "$shared_env" cmutpkopd0000p417lswjr97k read_learnings > "$fixture/shared-output" 2>&1; then
  echo 'existing shared bearer was accepted' >&2
  exit 1
fi

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
echo 'provision-discovery: PASS (mode, repeat rejection, fail-closed, no secret output)'
