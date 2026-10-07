# Viktor owner-task: read-only skills scope

Карты: `../svyaz/deleg-viktor/karta-owner-a2a-20261008.md`, `../svyaz/kanal/karta-viktor-a2a-owner-20261008.md`.

Санкционированный case `viktor-workspace-skills-read` просит перечислить навыки и прочесть один, а legacy owner-task gateway разрешал только `read_learnings`. Инструменты `list_skills` и `read_skill` уже выполняют scoped `prisma.skill` запросы с `where.workspaceId=ctx.workspaceId` в `packages/tools/src/tools/skills.ts`, `write_skill` не допускается. Меняется только read-only allowlist существующего runner; owner grant, внешний ingress и A2A сервер остаются недоступными до отдельного gate.

RED: `bun test apps/bot/src/tool-gateway/agent-task.test.ts` → 5 passed, 1 failed (missing `list_skills`, `read_skill`). GREEN: `bun test apps/bot/src/tool-gateway/agent-task.test.ts apps/bot/src/tool-gateway/agent-task-runtime.test.ts apps/bot/src/tool-gateway/viktor-a2a.test.ts` → 19 passed, 0 failed. Owner live/terminal Task не проверены.
