#!/usr/bin/env bash
# Воспроизводимая сборка образа Виктора (бот + A2A) из коммита репо openviktor.
#   docker/build-image.sh [--host SSH_HOST] [--push] [--no-os-tools]
# Собирает ИМЕННО закоммитованное дерево (git archive HEAD, не рабочую папку), метка
# org.opencontainers.image.revision = полный SHA HEAD, тег ruki/viktor:<SHA>.
#   без --host  : сборка локальным docker;
#   --host H    : контекст уходит по ssh на хост H (Alpha: twin-alpha-deploy), docker там;
#   --push      : после сборки docker push в реестр 127.0.0.1:5001 (реестр доступен только на самом хосте Alpha,
#                 поэтому --push требует --host) и печать digest для строки "viktor" релиза коробки.
set -euo pipefail
host=""; push=0; os_tools=true
while [ $# -gt 0 ]; do
  case "$1" in
    --host) host="${2:?}"; shift 2 ;;
    --push) push=1; shift ;;
    --no-os-tools) os_tools=false; shift ;;
    *) echo "usage: $0 [--host SSH_HOST] [--push] [--no-os-tools]" >&2; exit 2 ;;
  esac
done
[ "$push" = 0 ] || [ -n "$host" ] || { echo '--push требует --host (реестр 127.0.0.1:5001 только на Alpha)' >&2; exit 2; }
cd "$(git rev-parse --show-toplevel)"
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo 'дерево не чистое: соберите из коммита' >&2; exit 1; }
sha="$(git rev-parse HEAD)"
tag="127.0.0.1:5001/ruki/viktor:${sha}"
build=(docker build -f apps/bot/Dockerfile --target runner
  --build-arg "REVISION=${sha}" --build-arg "INSTALL_OS_TOOLS=${os_tools}" -t "$tag" -)
run() { if [ -n "$host" ]; then ssh "$host" "$(printf '%q ' "$@")"; else "$@"; fi; }
git archive --format=tar HEAD | run "${build[@]}"
rev="$(run docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$tag")"
[ "$rev" = "$sha" ] || { echo "метка revision=$rev, ожидалось $sha" >&2; exit 1; }
if [ "$push" = 1 ]; then
  run docker push "$tag"
  digest="$(run docker image inspect --format '{{index .RepoDigests 0}}' "$tag")"
  echo "viktor: \"${digest}\"   # строка images.viktor релиза коробки; revision=${sha}"
else
  run docker image inspect --format 'id={{.Id}}' "$tag"
fi
