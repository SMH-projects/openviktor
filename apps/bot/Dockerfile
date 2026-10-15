# База закреплена по digest (oven/bun 1.4.3-debian, проверено на Alpha 15.10.2026): плавающий тег `1-debian`
# сделал прод-образ 98af194d (bun 1.4.2) и образ PR8 bd1b5dec (bun 1.4.3) разными при одном коде.
# Обновлять базу — осознанным коммитом: --build-arg BUN_IMAGE=oven/bun:1-debian@sha256:<новый digest>.
ARG BUN_IMAGE=oven/bun:1-debian@sha256:923bedb355f7746666659f71e724998159a5c8c54bd1cb1030e1975a0698415b
FROM ${BUN_IMAGE} AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
COPY apps/bot/package.json apps/bot/
COPY apps/landing/package.json apps/landing/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY packages/tools/package.json packages/tools/
COPY packages/integrations/package.json packages/integrations/
RUN bun install --frozen-lockfile

FROM base AS dev
RUN apt-get update && apt-get install -y --no-install-recommends ripgrep && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun install && bun run --cwd packages/db db:generate
CMD ["sh", "-c", "bun run --filter @openviktor/db db:migrate:deploy && bun --watch run apps/bot/src/index.ts"]

FROM base AS runner
ARG INSTALL_OS_TOOLS=true
# Коммит openviktor, из которого собран образ (.git в контекст не попадает, поэтому через build-arg).
# Метки базового bun (revision/source/title/version) перекрываются здесь.
ARG REVISION
ARG SOURCE=https://github.com/SMH-projects/openviktor
RUN test -n "$REVISION" || { echo "build-arg REVISION (полный SHA коммита openviktor) обязателен: docker/build-image.sh" >&2; exit 1; }
LABEL org.opencontainers.image.title="openviktor-bot" \
      org.opencontainers.image.description="OpenViktor bot (Slack + A2A), runner stage of apps/bot/Dockerfile" \
      org.opencontainers.image.revision="${REVISION}" \
      org.opencontainers.image.source="${SOURCE}" \
      org.opencontainers.image.version="${REVISION}"
RUN if [ "$INSTALL_OS_TOOLS" = "true" ]; then \
      apt-get update && apt-get install -y --no-install-recommends curl ripgrep && rm -rf /var/lib/apt/lists/*; \
    fi
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun install --frozen-lockfile && bun run --cwd packages/db db:generate
CMD ["sh", "-c", "bun run --filter @openviktor/db db:migrate:deploy && bun run apps/bot/src/index.ts"]
